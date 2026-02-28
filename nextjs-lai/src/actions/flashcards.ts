'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { selectRepresentativeChunks, detectContentType } from '@/src/lib/quiz-generation'
import { getQuizQuestionById } from '@/src/data-access/quiz'
import {
    getFlashcards as dbGetFlashcards,
    getFlashcardsByDocument as dbGetFlashcardsByDocument,
    getDueFlashcards as dbGetDueFlashcards,
    getDueFlashcardCount as dbGetDueFlashcardCount,
    getFlashcardCount as dbGetFlashcardCount,
    createFlashcard as dbCreateFlashcard,
    createFlashcards as dbCreateFlashcards,
    upsertFlashcardProgress as dbUpsertFlashcardProgress,
    updateFlashcard as dbUpdateFlashcard,
    deleteFlashcard as dbDeleteFlashcard,
    deleteFlashcardsByDocument as dbDeleteFlashcardsByDocument,
    getQuestionIdsWithFlashcards as dbGetQuestionIdsWithFlashcards,
    getVocabularyFlashcards as dbGetVocabularyFlashcards,
    getDueVocabularyFlashcards as dbGetDueVocabularyFlashcards,
    getNewVocabularyFlashcards as dbGetNewVocabularyFlashcards,
    getDueVocabularyCount as dbGetDueVocabularyCount,
    getVocabularyLanguages as dbGetVocabularyLanguages,
    getFlashcardSchedulingPreview as dbGetFlashcardSchedulingPreview,
} from '@/src/data-access/flashcards'
import { Rating } from '@/src/lib/spaced-repetition'
import { revalidatePath } from 'next/cache'
import { revalidateFlashcards, revalidateUserStats } from '@/src/lib/dashboard-cache'
import { recordActivity } from '@/src/data-access/user-stats'

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

// ── Get flashcards for a specific document ──

export async function getFlashcardsByDocument(documentId: string) {
    return dbGetFlashcardsByDocument(documentId)
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

// ── Update a flashcard ──

export async function updateFlashcard(
    id: string,
    front: string,
    back: string,
    context?: string,
) {
    if (!id) throw new Error('Karteikarten-ID ist erforderlich.')
    if (!front.trim()) throw new Error('Vorderseite darf nicht leer sein.')
    if (!back.trim()) throw new Error('Rückseite darf nicht leer sein.')

    const card = await dbUpdateFlashcard(id, {
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

const conjugationSchema = z.object({
    present: z.record(z.string(), z.string()).optional().describe('Präsens-Konjugation: ich/du/er/wir/ihr/sie'),
    past: z.record(z.string(), z.string()).optional().describe('Präteritum-Konjugation: ich/du/er/wir/ihr/sie'),
    perfect: z.record(z.string(), z.string()).optional().describe('Perfekt-Konjugation: ich/du/er/wir/ihr/sie'),
})

const vocabFlashcardElementSchema = z.object({
    front: z.string().describe('Das Wort, die Phrase oder der Begriff'),
    back: z.string().describe('Die Übersetzung, Definition oder Erklärung'),
    context: z.string().optional().describe('Optionales Zitat aus dem Quelltext'),
    sourceSection: z.number().describe('Abschnittsnummer (1-basiert)'),
    exampleSentence: z.string().optional().describe('Ein Beispielsatz mit dem Wort'),
    partOfSpeech: z.string().optional().describe('Wortart: Verb, Nomen, Adjektiv, Adverb, etc.'),
    conjugation: conjugationSchema.optional().describe('Konjugationstabelle, nur bei Verben'),
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

    const contentType = detectContentType(contextText)
    const isVocab = contentType === 'vocabulary'

    const systemPrompt = isVocab
        ? 'Du erstellst Vokabel-Karteikarten. Erstelle pro Wort oder Phrase genau eine Karteikarte. Gib wenn möglich einen Beispielsatz und die Wortart an. Falls das Wort ein Verb ist, gib die Konjugation an.'
        : 'Du erstellst Karteikarten auf Deutsch basierend auf Lerntexten.'
    const userPrompt = isVocab
        ? `Der folgende Text ist eine Vokabelliste. Erstelle pro Eintrag (Wort, Phrase oder Begriff) genau eine Karteikarte.

Anforderungen:
- front: Das Wort, die Phrase oder der Begriff
- back: Die Übersetzung, Definition oder Erklärung
- exampleSentence: Ein Beispielsatz, der das Wort verwendet (optional)
- partOfSpeech: Wortart (Verb, Nomen, Adjektiv, etc.) (optional)
- conjugation: Falls das Wort ein Verb ist, gib die Konjugation an (Präsens, Präteritum, Perfekt) mit den Pronomen ich/du/er/wir/ihr/sie. Bei Nicht-Verben weglassen.
- sourceSection: Abschnittsnummer (1 bis ${selectedChunks.length})
- Ignoriere Leerzeilen und Überschriften

Text:
${contextText}`
        : `Erstelle genau ${clampedCount} Karteikarten aus dem folgenden Text (${selectedChunks.length} Abschnitte).

Anforderungen:
- front: Kurze Frage oder Begriff (max. 1 Satz)
- back: Präzise Antwort oder Erklärung
- sourceSection: Abschnittsnummer (1 bis ${selectedChunks.length})
- Gleichmäßig über alle Abschnitte verteilen

Fokus: Definitionen, Kernkonzepte, Fakten (Zahlen, Daten, Namen), Praxiswissen

Text:
${contextText}`

    if (isVocab) {
        const { output } = await generateText({
            model: getModel(),
            system: systemPrompt,
            output: Output.array({ element: vocabFlashcardElementSchema }),
            prompt: userPrompt,
        })

        if (!output || output.length === 0) {
            throw new Error('Das LLM konnte keine gültigen Karteikarten generieren.')
        }

        const dataToSave = output.slice(0, clampedCount).map((card) => {
            const idx = Math.max(0, Math.min((card.sourceSection || 1) - 1, selectedChunks.length - 1))
            return {
                documentId,
                front: card.front,
                back: card.back,
                context: card.context || undefined,
                chunkId: selectedChunks[idx].id,
                isVocabulary: true,
                exampleSentence: card.exampleSentence || undefined,
                partOfSpeech: card.partOfSpeech || undefined,
                conjugation: card.conjugation || undefined,
            }
        })

        await dbCreateFlashcards(dataToSave)
        revalidatePath('/learn/flashcards')
        revalidatePath('/learn/vocabulary')
        revalidateFlashcards()
        return { count: dataToSave.length }
    }

    const { output } = await generateText({
        model: getModel(),
        system: systemPrompt,
        output: Output.array({ element: flashcardElementSchema }),
        prompt: userPrompt,
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
    revalidateFlashcards()

    return { count: dataToSave.length }
}

// ── Review a flashcard (rate and update progress) ──

export async function reviewFlashcard(flashcardId: string, rating: number) {
    if (!flashcardId) throw new Error('Karteikarten-ID ist erforderlich.')
    if (rating < 1 || rating > 4) throw new Error('Bewertung muss zwischen 1 und 4 liegen.')

    await dbUpsertFlashcardProgress(flashcardId, rating as Rating)
    revalidatePath('/learn/flashcards')
    revalidateFlashcards()

    // Track activity for streaks (fire-and-forget)
    recordActivity().then(() => revalidateUserStats()).catch(console.error)
}

// ── Get scheduling preview for rating buttons ──

export async function getSchedulingPreview(flashcardId: string) {
    if (!flashcardId) throw new Error('Karteikarten-ID ist erforderlich.')
    return dbGetFlashcardSchedulingPreview(flashcardId)
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
        documentId: question.quiz.documentId!,
        front,
        back,
        context: question.sourceSnippet || undefined,
        chunkId: question.sourceChunkId || undefined,
        sourceQuestionId: questionId,
    })

    revalidatePath('/learn/flashcards')
    return card
}

// ── Check which questions already have flashcards ──

export async function getQuestionIdsWithFlashcards(questionIds: string[]) {
    return dbGetQuestionIdsWithFlashcards(questionIds)
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

// ── Vocabulary-specific actions ──

export async function getVocabularyFlashcards(documentId?: string, language?: string) {
    return dbGetVocabularyFlashcards(documentId, language)
}

export async function getDueVocabularyFlashcards(documentId?: string) {
    return dbGetDueVocabularyFlashcards(20, documentId)
}

export async function getNewVocabularyFlashcards(limit?: number, documentId?: string) {
    return dbGetNewVocabularyFlashcards(limit, documentId)
}

export async function getDueVocabularyCount() {
    return dbGetDueVocabularyCount()
}

export async function getVocabularyLanguages() {
    return dbGetVocabularyLanguages()
}
