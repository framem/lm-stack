'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { selectRepresentativeChunks } from '@/src/lib/quiz-generation'
import {
    getFlashcards as dbGetFlashcards,
    getDueFlashcards as dbGetDueFlashcards,
    getDueFlashcardCount as dbGetDueFlashcardCount,
    getFlashcardCount as dbGetFlashcardCount,
    createFlashcard as dbCreateFlashcard,
    createFlashcards as dbCreateFlashcards,
    upsertFlashcardProgress as dbUpsertFlashcardProgress,
    deleteFlashcard as dbDeleteFlashcard,
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

// Strip <think>...</think> blocks
function stripThinkTags(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

const flashcardSchema = z.object({
    cards: z.array(z.object({
        front: z.string(),
        back: z.string(),
        context: z.string().optional(),
        sourceSection: z.number(),
    })),
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

    const { output, text } = await generateText({
        model: getModel(),
        output: Output.object({ schema: flashcardSchema }),
        prompt: `Erstelle genau ${clampedCount} Karteikarten basierend auf dem folgenden Text.
Der Text ist in ${selectedChunks.length} nummerierte Abschnitte unterteilt.

Jede Karteikarte soll:
- front: Eine Frage, ein Begriff oder ein Konzept (kurz und prägnant)
- back: Die Antwort, Definition oder Erklärung
- context: (optional) Ein kurzer Kontextsatz aus dem Quelltext, der beim Verständnis hilft
- sourceSection: Die Nummer des Abschnitts (1-${selectedChunks.length}), aus dem die Karte stammt

Fokussiere dich auf:
- Wichtige Begriffe und Definitionen
- Kernkonzepte und Zusammenhänge
- Faktenwissen (Zahlen, Daten, Namen)
- Praxisrelevantes Wissen

Verteile die Karten möglichst gleichmäßig über alle Abschnitte.
Antworte ausschließlich mit gültigem JSON.

Text:
${contextText}`,
    })

    let cards = output?.cards
    if (!cards || cards.length === 0) {
        // Try to parse from raw text as fallback
        try {
            const cleaned = stripThinkTags(text)
            const parsed = JSON.parse(cleaned)
            cards = flashcardSchema.parse(parsed).cards
        } catch {
            throw new Error('Das LLM konnte keine gültigen Karteikarten generieren.')
        }
    }

    const dataToSave = cards.slice(0, clampedCount).map((card) => {
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

// ── Delete a flashcard ──

export async function deleteFlashcard(id: string) {
    if (!id) throw new Error('Karteikarten-ID ist erforderlich.')
    await dbDeleteFlashcard(id)
    revalidatePath('/learn/flashcards')
}
