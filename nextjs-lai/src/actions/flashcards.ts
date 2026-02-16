'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { selectRepresentativeChunks } from '@/src/lib/quiz-generation'
import { getQuizQuestionById } from '@/src/data-access/quiz'
import {
    getFlashcards as dbGetFlashcards,
    getDueFlashcards as dbGetDueFlashcards,
    getDueFlashcardCount as dbGetDueFlashcardCount,
    getFlashcardCount as dbGetFlashcardCount,
    createFlashcard as dbCreateFlashcard,
    createFlashcards as dbCreateFlashcards,
    upsertFlashcardProgress as dbUpsertFlashcardProgress,
    deleteFlashcard as dbDeleteFlashcard,
    deleteFlashcardsByDocument as dbDeleteFlashcardsByDocument,
} from '@/src/data-access/flashcards'
import { revalidatePath } from 'next/cache'

// ── List flashcards ──

export async function getFlashcards(documentId?: string) {
    return dbGetFlashcards(documentId)
}

export async function getDueFlashcards() {
    return dbGetDueFlashcards()
}

export async function getDueFlashcardCount() {
    return dbGetDueFlashcardCount()
}

export async function getFlashcardCount() {
    return dbGetFlashcardCount()
}

// ── Create flashcard manually ──

export async function createFlashcard(
    documentId: string,
    front: string,
    back: string,
    context?: string,
) {
    if (!documentId) throw new Error('Lernmaterial-ID ist erforderlich.')
    if (!front.trim()) throw new Error('Vorderseite darf nicht leer sein.')
    if (!back.trim()) throw new Error('Rückseite darf nicht leer sein.')

    const card = await dbCreateFlashcard({
        documentId,
        front: front.trim(),
        back: back.trim(),
        context: context?.trim() || undefined,
    })

    revalidatePath('/learn/flashcards')
    return card
}

// ── AI-generate flashcards from document ──

const flashcardElementSchema = z.object({
    front: z.string().describe('Kurze Frage, Begriff oder Konzept'),
    back: z.string().describe('Antwort, Definition oder Erklärung'),
    context: z.string().optional().describe('Optionales Zitat aus dem Quelltext'),
    sourceSection: z.number().describe('Abschnittsnummer (1-basiert)'),
})

export async function generateFlashcards(documentId: string, count: number = 10) {
    if (!documentId) throw new Error('Lernmaterial-ID ist erforderlich.')

    const document = await getDocumentWithChunks(documentId)
    if (!document) throw new Error('Lernmaterial nicht gefunden.')
    if (!document.chunks || document.chunks.length === 0) {
        throw new Error('Das Lernmaterial hat keine verarbeiteten Textabschnitte.')
    }

    const clampedCount = Math.min(Math.max(count, 1), 30)
    const selectedChunks = selectRepresentativeChunks(document.chunks, clampedCount)

    // Number the chunks so the LLM can reference them
    const contextText = selectedChunks
        .map((c, i) => `[Abschnitt ${i + 1}]\n${c.content}`)
        .join('\n\n---\n\n')

    const { output } = await generateText({
        model: getModel(),
        system: 'Du erstellst Karteikarten auf Deutsch basierend auf Lerntexten.',
        output: Output.array({ element: flashcardElementSchema }),
        prompt: `Erstelle genau ${clampedCount} Karteikarten aus dem folgenden Text (${selectedChunks.length} Abschnitte).

Anforderungen:
- front: Kurze Frage oder Begriff (max. 1 Satz)
- back: Präzise Antwort oder Erklärung
- sourceSection: Abschnittsnummer (1 bis ${selectedChunks.length})
- Gleichmäßig über alle Abschnitte verteilen

Fokus: Definitionen, Kernkonzepte, Fakten (Zahlen, Daten, Namen), Praxiswissen

Text:
${contextText}`,
    })

    if (!output || output.length === 0) {
        throw new Error('Das LLM konnte keine gültigen Karteikarten generieren.')
    }

    const dataToSave = output.slice(0, clampedCount).map((card) => {
        // Map 1-based sourceSection back to the selected chunk
        const idx = Math.max(0, Math.min((card.sourceSection || 1) - 1, selectedChunks.length - 1))
        return {
            documentId,
            front: card.front,
            back: card.back,
            context: card.context || undefined,
            chunkId: selectedChunks[idx].id,
        }
    })

    await dbCreateFlashcards(dataToSave)
    revalidatePath('/learn/flashcards')

    return { count: dataToSave.length }
}

// ── Review a flashcard (rate and update progress) ──

export async function reviewFlashcard(flashcardId: string, quality: number) {
    if (!flashcardId) throw new Error('Karteikarten-ID ist erforderlich.')
    if (quality < 0 || quality > 5) throw new Error('Bewertung muss zwischen 0 und 5 liegen.')

    await dbUpsertFlashcardProgress(flashcardId, quality)
    revalidatePath('/learn/flashcards')
}

// ── Create flashcard from a quiz question ──

export async function createFlashcardFromQuestion(questionId: string) {
    if (!questionId) throw new Error('Frage-ID ist erforderlich.')

    const question = await getQuizQuestionById(questionId)
    if (!question) throw new Error('Frage nicht gefunden.')

    const front = question.questionText
    const options = question.options as string[] | null
    const type = question.questionType || 'singleChoice'

    // Build back side from correct answer
    let answer = ''
    if (type === 'singleChoice' || type === 'truefalse') {
        if (options && question.correctIndex !== null) {
            answer = options[question.correctIndex]
        }
    } else if (type === 'multipleChoice') {
        const indices = question.correctIndices as number[] | null
        if (options && indices) {
            answer = indices.map(i => options[i]).join(', ')
        }
    } else if (type === 'freetext') {
        answer = question.correctAnswer || ''
    }

    const back = question.explanation
        ? `${answer}\n\n${question.explanation}`
        : answer

    const card = await dbCreateFlashcard({
        documentId: question.quiz.documentId,
        front,
        back,
        context: question.sourceSnippet || undefined,
        chunkId: question.sourceChunkId || undefined,
    })

    revalidatePath('/learn/flashcards')
    return card
}

// ── Delete a flashcard ──

export async function deleteFlashcard(id: string) {
    if (!id) throw new Error('Karteikarten-ID ist erforderlich.')
    await dbDeleteFlashcard(id)
    revalidatePath('/learn/flashcards')
}

// ── Delete all flashcards for a document ──

export async function deleteFlashcardsByDocument(documentId: string) {
    if (!documentId) throw new Error('Lernmaterial-ID ist erforderlich.')
    const result = await dbDeleteFlashcardsByDocument(documentId)
    revalidatePath('/learn/flashcards')
    return result.count
}
