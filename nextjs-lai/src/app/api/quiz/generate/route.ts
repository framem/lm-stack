import { NextRequest, NextResponse } from 'next/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { createQuiz, addQuestions } from '@/src/data-access/quiz'

// Output schemas per question type
const mcQuestionSchema = z.object({
    questionText: z.string(),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().min(0).max(3),
    explanation: z.string(),
    sourceSnippet: z.string(),
})

const freetextQuestionSchema = z.object({
    questionText: z.string(),
    correctAnswer: z.string(),
    explanation: z.string(),
    sourceSnippet: z.string(),
})

const truefalseQuestionSchema = z.object({
    questionText: z.string(),
    correctAnswer: z.enum(['wahr', 'falsch']),
    explanation: z.string(),
    sourceSnippet: z.string(),
})

// Select representative chunks distributed evenly across the document
function selectRepresentativeChunks(
    chunks: { id: string; content: string; chunkIndex: number }[],
    count: number
) {
    if (chunks.length <= count) return chunks

    const step = chunks.length / count
    const selected = []
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(i * step)
        selected.push(chunks[idx])
    }
    return selected
}

// Distribute question count across selected types as evenly as possible
function distributeQuestions(total: number, types: string[]): Record<string, number> {
    const base = Math.floor(total / types.length)
    let remainder = total - base * types.length
    const distribution: Record<string, number> = {}
    for (const type of types) {
        distribution[type] = base + (remainder > 0 ? 1 : 0)
        if (remainder > 0) remainder--
    }
    return distribution
}

// Generate MC questions via LLM
async function generateMcQuestions(contextText: string, count: number) {
    const schema = z.object({ questions: z.array(mcQuestionSchema) })
    const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema }),
        prompt: `Erstelle genau ${count} Multiple-Choice-Fragen basierend auf dem folgenden Text.
Jede Frage soll:
- Genau 4 Antwortmöglichkeiten haben
- Eine korrekte Antwort haben (correctIndex: 0-3)
- Eine Erklärung enthalten, warum die korrekte Antwort richtig ist
- Ein Zitat aus dem Quelltext enthalten (sourceSnippet)

Antworte ausschließlich mit gültigem JSON.

Text:
${contextText}`,
    })
    return output?.questions ?? []
}

// Generate freetext questions via LLM
async function generateFreetextQuestions(contextText: string, count: number) {
    const schema = z.object({ questions: z.array(freetextQuestionSchema) })
    const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema }),
        prompt: `Erstelle genau ${count} Freitext-Fragen basierend auf dem folgenden Text.
Jede Frage soll:
- Eine offene Frage sein, die der Benutzer in eigenen Worten beantworten muss
- Eine Musterantwort haben (correctAnswer), die als Bewertungsgrundlage dient
- Eine Erklärung enthalten, warum die Musterantwort korrekt ist
- Ein Zitat aus dem Quelltext enthalten (sourceSnippet)

Antworte ausschließlich mit gültigem JSON.

Text:
${contextText}`,
    })
    return output?.questions ?? []
}

// Generate true/false questions via LLM
async function generateTruefalseQuestions(contextText: string, count: number) {
    const schema = z.object({ questions: z.array(truefalseQuestionSchema) })
    const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema }),
        prompt: `Erstelle genau ${count} Wahr-oder-Falsch-Fragen basierend auf dem folgenden Text.
Jede Frage soll:
- Eine Aussage sein, die entweder wahr oder falsch ist
- correctAnswer: "wahr" oder "falsch"
- Eine Erklärung enthalten, warum die Aussage wahr oder falsch ist
- Ein Zitat aus dem Quelltext enthalten (sourceSnippet)

Antworte ausschließlich mit gültigem JSON.

Text:
${contextText}`,
    })
    return output?.questions ?? []
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            documentId,
            questionCount = 5,
            questionTypes = ['mc'],
        } = body

        if (!documentId) {
            return NextResponse.json(
                { error: 'Dokument-ID ist erforderlich.' },
                { status: 400 }
            )
        }

        const validTypes = ['mc', 'freetext', 'truefalse']
        const types: string[] = (Array.isArray(questionTypes) ? questionTypes : ['mc'])
            .filter((t: string) => validTypes.includes(t))
        if (types.length === 0) {
            return NextResponse.json(
                { error: 'Mindestens ein gültiger Fragetyp ist erforderlich (mc, freetext, truefalse).' },
                { status: 400 }
            )
        }

        const count = Math.min(Math.max(Number(questionCount), 1), 20)

        // Load document with chunks
        const document = await getDocumentWithChunks(documentId)
        if (!document) {
            return NextResponse.json(
                { error: 'Dokument nicht gefunden.' },
                { status: 404 }
            )
        }

        if (!document.chunks || document.chunks.length === 0) {
            return NextResponse.json(
                { error: 'Das Dokument hat keine verarbeiteten Textabschnitte.' },
                { status: 400 }
            )
        }

        // Select representative chunks distributed across the document
        const selectedChunks = selectRepresentativeChunks(document.chunks, count)
        const contextText = selectedChunks.map((c) => c.content).join('\n\n---\n\n')

        // Distribute questions across types and generate in parallel
        const distribution = distributeQuestions(count, types)

        interface QuestionToSave {
            questionText: string
            options: string[] | null
            correctIndex: number | null
            correctAnswer?: string
            explanation: string
            sourceSnippet: string
            questionType: string
        }

        const allQuestions: QuestionToSave[] = []
        const generationTasks: Promise<void>[] = []

        if (distribution['mc']) {
            generationTasks.push(
                generateMcQuestions(contextText, distribution['mc']).then((qs) => {
                    for (const q of qs) {
                        allQuestions.push({
                            questionText: q.questionText,
                            options: q.options,
                            correctIndex: q.correctIndex,
                            explanation: q.explanation,
                            sourceSnippet: q.sourceSnippet,
                            questionType: 'mc',
                        })
                    }
                })
            )
        }

        if (distribution['freetext']) {
            generationTasks.push(
                generateFreetextQuestions(contextText, distribution['freetext']).then((qs) => {
                    for (const q of qs) {
                        allQuestions.push({
                            questionText: q.questionText,
                            options: null,
                            correctIndex: null,
                            correctAnswer: q.correctAnswer,
                            explanation: q.explanation,
                            sourceSnippet: q.sourceSnippet,
                            questionType: 'freetext',
                        })
                    }
                })
            )
        }

        if (distribution['truefalse']) {
            generationTasks.push(
                generateTruefalseQuestions(contextText, distribution['truefalse']).then((qs) => {
                    for (const q of qs) {
                        allQuestions.push({
                            questionText: q.questionText,
                            options: ['Wahr', 'Falsch'],
                            correctIndex: q.correctAnswer === 'wahr' ? 0 : 1,
                            correctAnswer: q.correctAnswer,
                            explanation: q.explanation,
                            sourceSnippet: q.sourceSnippet,
                            questionType: 'truefalse',
                        })
                    }
                })
            )
        }

        await Promise.all(generationTasks)

        if (allQuestions.length === 0) {
            return NextResponse.json(
                { error: 'Das LLM konnte keine gültige Antwort generieren.' },
                { status: 502 }
            )
        }

        // Create quiz in DB
        const quiz = await createQuiz(
            `Quiz: ${document.title}`,
            documentId
        )

        // Save questions with correct indices
        const questionsToSave = allQuestions.slice(0, count).map((q, i) => ({
            questionText: q.questionText,
            options: q.options,
            correctIndex: q.correctIndex,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            sourceChunkId: selectedChunks[i]?.id,
            sourceSnippet: q.sourceSnippet,
            questionIndex: i,
            questionType: q.questionType,
        }))

        await addQuestions(quiz.id, questionsToSave)

        return NextResponse.json({ quizId: quiz.id })
    } catch (error) {
        console.error('Quiz generation error:', error)
        return NextResponse.json(
            { error: 'Fehler bei der Quiz-Erstellung.' },
            { status: 500 }
        )
    }
}
