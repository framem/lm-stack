'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { prisma } from '@/src/lib/prisma'
import {
    getQuizzes as dbGetQuizzes,
    getQuizWithQuestions as dbGetQuizWithQuestions,
    getQuizResults as dbGetQuizResults,
    getDocumentProgress as dbGetDocumentProgress,
    deleteQuiz as dbDeleteQuiz,
    createQuiz as dbCreateQuiz,
    addQuestions as dbAddQuestions,
    recordAttempt as dbRecordAttempt,
} from '@/src/data-access/quiz'

// ── List all quizzes ──

export async function getQuizzes() {
    return dbGetQuizzes()
}

// ── Get quiz with sanitized questions (no correct answers) ──

export async function getQuiz(id: string) {
    const quiz = await dbGetQuizWithQuestions(id)
    if (!quiz) return null

    // Strip correctIndex/correctAnswer for cheat protection
    const sanitizedQuestions = quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        questionIndex: q.questionIndex,
        questionType: q.questionType,
    }))

    return {
        id: quiz.id,
        title: quiz.title,
        document: quiz.document,
        createdAt: quiz.createdAt,
        questions: sanitizedQuestions,
    }
}

// ── Delete a quiz ──

export async function deleteQuiz(id: string) {
    const quiz = await dbGetQuizWithQuestions(id)
    if (!quiz) {
        throw new Error('Quiz nicht gefunden.')
    }
    await dbDeleteQuiz(id)
}

// ── Get quiz results ──

export async function getQuizResults(id: string) {
    return dbGetQuizResults(id)
}

// ── Knowledge progress per document ──

export async function getDocumentProgress() {
    return dbGetDocumentProgress()
}

// ── Generate quiz from document ──

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

// ~4 chars per token; reserve space for prompt template + output tokens
const MAX_CONTEXT_CHARS = Number(process.env.QUIZ_MAX_CONTEXT_CHARS) || 6000

// Select representative chunks distributed evenly across the document,
// respecting MAX_CONTEXT_CHARS to avoid exceeding the LLM context window.
function selectRepresentativeChunks(
    chunks: { id: string; content: string; chunkIndex: number }[],
    count: number
) {
    const target = Math.min(chunks.length, count)

    // Try with target count, then progressively reduce if too large
    for (let n = target; n >= 1; n--) {
        const step = chunks.length / n
        const selected = []
        let totalLen = 0
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(i * step)
            selected.push(chunks[idx])
            totalLen += chunks[idx].content.length
        }
        // Account for separators between chunks
        totalLen += (n - 1) * 7 // '\n\n---\n\n'.length
        if (totalLen <= MAX_CONTEXT_CHARS) return selected
    }

    // Even a single chunk is too large — truncate its content
    const chunk = chunks[0]
    return [{ ...chunk, content: chunk.content.slice(0, MAX_CONTEXT_CHARS) }]
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

interface QuestionToSave {
    questionText: string
    options: string[] | null
    correctIndex: number | null
    correctAnswer?: string
    explanation: string
    sourceSnippet: string
    questionType: string
}

export async function generateQuiz(
    documentId: string,
    questionCount: number = 5,
    questionTypes: string[] = ['mc']
) {
    if (!documentId) {
        throw new Error('Dokument-ID ist erforderlich.')
    }

    const validTypes = ['mc', 'freetext', 'truefalse']
    const types = (Array.isArray(questionTypes) ? questionTypes : ['mc'])
        .filter((t: string) => validTypes.includes(t))
    if (types.length === 0) {
        throw new Error('Mindestens ein gueltiger Fragetyp ist erforderlich (mc, freetext, truefalse).')
    }

    const count = Math.min(Math.max(Number(questionCount), 1), 20)

    // Load document with chunks
    const document = await getDocumentWithChunks(documentId)
    if (!document) {
        throw new Error('Dokument nicht gefunden.')
    }

    if (!document.chunks || document.chunks.length === 0) {
        throw new Error('Das Dokument hat keine verarbeiteten Textabschnitte.')
    }

    // Select representative chunks distributed across the document
    const selectedChunks = selectRepresentativeChunks(document.chunks, count)
    const contextText = selectedChunks.map((c) => c.content).join('\n\n---\n\n')

    // Distribute questions across types and generate in parallel
    const distribution = distributeQuestions(count, types)

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
        throw new Error('Das LLM konnte keine gueltige Antwort generieren.')
    }

    // Create quiz in DB
    const quiz = await dbCreateQuiz(document.title, documentId)

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

    await dbAddQuestions(quiz.id, questionsToSave)

    return { quizId: quiz.id }
}

// ── Evaluate a quiz answer ──

// Evaluate mc/truefalse questions by comparing selectedIndex to correctIndex
async function evaluateSelection(
    question: {
        id: string
        questionText: string
        options: unknown
        correctIndex: number | null
        explanation: string | null
        sourceSnippet: string | null
    },
    selectedIndex: number,
    sanitizedFreeText?: string,
) {
    const options = question.options as string[]
    const isCorrect = selectedIndex === question.correctIndex
    let explanation: string | undefined

    if (!isCorrect) {
        const { text } = await generateText({
            model: getModel(),
            prompt: `Der Benutzer hat eine Multiple-Choice-Frage falsch beantwortet.

Frage: ${question.questionText}

Gewählte Antwort (falsch): ${options[selectedIndex]}
Korrekte Antwort: ${options[question.correctIndex!]}

${question.sourceSnippet ? `Quelle: "${question.sourceSnippet}"` : ''}

Erkläre kurz und verständlich:
1. Warum die gewählte Antwort falsch ist
2. Warum die korrekte Antwort richtig ist
3. Zitiere relevante Stellen aus dem Quelltext`,
        })
        explanation = text
    } else {
        explanation = question.explanation ?? undefined
    }

    const attempt = await dbRecordAttempt(
        question.id, selectedIndex, isCorrect, explanation,
        sanitizedFreeText
    )

    return {
        isCorrect,
        correctIndex: question.correctIndex,
        explanation,
        attemptId: attempt.id,
    }
}

// Evaluate freetext questions via LLM comparison
const freetextEvalSchema = z.object({
    correct: z.enum(['yes', 'partly', 'no']),
    feedback: z.string(),
})

async function evaluateFreetext(
    question: {
        id: string
        questionText: string
        correctAnswer: string | null
        sourceSnippet: string | null
    },
    freeTextAnswer: string,
) {
    const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema: freetextEvalSchema }),
        prompt: `Prüfe ob die Antwort des Benutzers inhaltlich zur richtigen Antwort passt.

Beispiele:
Richtig: "€5,00 pro Berichtseite" | Benutzer: "5€ pro Seite" → correct: "yes" (gleicher Betrag, gleiche Bedeutung)
Richtig: "Berlin" | Benutzer: "berlin" → correct: "yes" (gleiche Stadt)
Richtig: "3 Monate" | Benutzer: "12 Wochen" → correct: "yes" (gleicher Zeitraum)
Richtig: "Die Erde kreist um die Sonne" | Benutzer: "Der Mond" → correct: "no" (falsch)
Richtig: "Vertrag läuft 2 Jahre mit 5% Rabatt" | Benutzer: "2 Jahre" → correct: "partly" (Rabatt fehlt)

Jetzt bewerte:
Richtige Antwort: "${question.correctAnswer ?? 'Unbekannt'}"
Antwort des Benutzers: "${freeTextAnswer}"

correct: "yes", "partly" oder "no"
feedback: Ein kurzer Satz auf Deutsch.`,
    })

    const scoreMap = { yes: 1.0, partly: 0.5, no: 0.0 } as const
    const freeTextScore = output ? scoreMap[output.correct] ?? 0 : 0
    const freeTextFeedback = output?.feedback ?? 'Bewertung konnte nicht verarbeitet werden.'

    const isCorrect = freeTextScore >= 0.5

    const attempt = await dbRecordAttempt(
        question.id, null, isCorrect, undefined,
        freeTextAnswer, freeTextScore, freeTextFeedback
    )

    return {
        isCorrect,
        freeTextScore,
        freeTextFeedback,
        attemptId: attempt.id,
    }
}

export async function evaluateAnswer(
    questionId: string,
    selectedIndex?: number | null,
    freeTextAnswer?: string,
) {
    if (!questionId) {
        throw new Error('Frage-ID ist erforderlich.')
    }

    // Load question from DB
    const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
    })

    if (!question) {
        throw new Error('Frage nicht gefunden.')
    }

    const questionType = question.questionType

    // Validate: mc and truefalse require selectedIndex
    if ((questionType === 'mc' || questionType === 'truefalse') &&
        (selectedIndex === undefined || selectedIndex === null)) {
        throw new Error('Ausgewaehlter Index ist fuer diesen Fragetyp erforderlich.')
    }

    // Validate: freetext requires freeTextAnswer
    if (questionType === 'freetext' && !freeTextAnswer) {
        throw new Error('Eine Freitext-Antwort ist fuer diesen Fragetyp erforderlich.')
    }

    // Sanitize free-text answer (prompt injection protection)
    const sanitizedFreeText = typeof freeTextAnswer === 'string'
        ? freeTextAnswer.slice(0, 2000)
        : undefined

    // Evaluate based on question type
    if (questionType === 'freetext') {
        return evaluateFreetext(question, sanitizedFreeText!)
    }

    // MC or truefalse evaluation
    return evaluateSelection(question, selectedIndex!, sanitizedFreeText)
}
