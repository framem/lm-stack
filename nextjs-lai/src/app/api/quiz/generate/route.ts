import { NextRequest, NextResponse } from 'next/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { createQuiz, addQuestions } from '@/src/data-access/quiz'

const questionSchema = z.object({
    questions: z.array(z.object({
        questionText: z.string(),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().min(0).max(3),
        explanation: z.string(),
        sourceSnippet: z.string(),
    }))
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { documentId, questionCount = 5 } = body

        if (!documentId) {
            return NextResponse.json(
                { error: 'Dokument-ID ist erforderlich.' },
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

        // Generate questions via LLM
        const { output } = await generateText({
            model: getModel(),
            output: Output.object({ schema: questionSchema }),
            prompt: `Erstelle genau ${count} Multiple-Choice-Fragen basierend auf dem folgenden Text.
Jede Frage soll:
- Genau 4 Antwortmöglichkeiten haben
- Eine korrekte Antwort haben (correctIndex: 0-3)
- Eine Erklärung enthalten, warum die korrekte Antwort richtig ist
- Ein Zitat aus dem Quelltext enthalten

Antworte ausschließlich mit gültigem JSON.

Text:
${contextText}`,
        })

        if (!output) {
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

        // Save questions
        const questionsToSave = output.questions.slice(0, count).map((q, i) => ({
            questionText: q.questionText,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            sourceChunkId: selectedChunks[i]?.id,
            sourceSnippet: q.sourceSnippet,
            questionIndex: i,
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
