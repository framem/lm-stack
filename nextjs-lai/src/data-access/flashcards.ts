import { prisma } from '@/src/lib/prisma'
import { sm2 } from '@/src/lib/spaced-repetition'

interface CreateFlashcardInput {
    documentId: string
    front: string
    back: string
    context?: string
    chunkId?: string
    sourceQuestionId?: string
    isVocabulary?: boolean
    exampleSentence?: string
    partOfSpeech?: string
    conjugation?: Record<string, Record<string, string>>
}

// Create a single flashcard
export async function createFlashcard(data: CreateFlashcardInput) {
    return prisma.flashcard.create({ data })
}

// Create multiple flashcards at once
export async function createFlashcards(data: CreateFlashcardInput[]) {
    return prisma.flashcard.createMany({ data })
}

// Get all flashcards, optionally filtered by document
export async function getFlashcards(documentId?: string) {
    return prisma.flashcard.findMany({
        where: documentId ? { documentId } : undefined,
        include: {
            document: { select: { id: true, title: true } },
            chunk: { select: { id: true, content: true, chunkIndex: true } },
            progress: true,
        },
        orderBy: { createdAt: 'desc' },
    })
}

// Get flashcards for a specific document
export async function getFlashcardsByDocument(documentId: string) {
    return prisma.flashcard.findMany({
        where: { documentId },
        include: { progress: true },
        orderBy: { createdAt: 'desc' },
    })
}

// Get flashcards due for review (includes new cards without progress)
export async function getDueFlashcards(limit: number = 20) {
    return prisma.flashcard.findMany({
        where: {
            OR: [
                // New cards — no progress record yet
                { progress: null },
                // Reviewed cards that are due
                { progress: { nextReviewAt: { lte: new Date() } } },
            ],
        },
        include: {
            document: { select: { id: true, title: true } },
            chunk: { select: { id: true, content: true, chunkIndex: true } },
            progress: true,
        },
        take: limit,
        orderBy: { createdAt: 'asc' },
    })
}

// Count of due flashcards (includes new cards without progress)
export async function getDueFlashcardCount() {
    const [newCards, dueCards] = await Promise.all([
        prisma.flashcard.count({ where: { progress: null } }),
        prisma.flashcardProgress.count({ where: { nextReviewAt: { lte: new Date() } } }),
    ])
    return newCards + dueCards
}

// Upsert flashcard progress using SM-2
export async function upsertFlashcardProgress(flashcardId: string, quality: number) {
    const existing = await prisma.flashcardProgress.findUnique({
        where: { flashcardId },
    })

    const result = sm2({
        quality,
        easeFactor: existing?.easeFactor ?? 2.5,
        interval: existing?.interval ?? 1,
        repetitions: existing?.repetitions ?? 0,
    })

    return prisma.flashcardProgress.upsert({
        where: { flashcardId },
        create: {
            flashcardId,
            easeFactor: result.easeFactor,
            interval: result.interval,
            repetitions: result.repetitions,
            nextReviewAt: result.nextReviewAt,
            lastReviewedAt: new Date(),
        },
        update: {
            easeFactor: result.easeFactor,
            interval: result.interval,
            repetitions: result.repetitions,
            nextReviewAt: result.nextReviewAt,
            lastReviewedAt: new Date(),
        },
    })
}

// Delete a flashcard
export async function deleteFlashcard(id: string) {
    return prisma.flashcard.delete({ where: { id } })
}

// Delete all flashcards for a document
export async function deleteFlashcardsByDocument(documentId: string) {
    return prisma.flashcard.deleteMany({ where: { documentId } })
}

// Get question IDs that already have flashcards created from them
export async function getQuestionIdsWithFlashcards(questionIds: string[]) {
    if (questionIds.length === 0) return []
    const rows = await prisma.flashcard.findMany({
        where: { sourceQuestionId: { in: questionIds } },
        select: { sourceQuestionId: true },
        distinct: ['sourceQuestionId'],
    })
    return rows.map((r) => r.sourceQuestionId!).filter(Boolean)
}

// Count flashcards (total)
export async function getFlashcardCount() {
    return prisma.flashcard.count()
}

// Get vocabulary flashcards, optionally filtered by document
export async function getVocabularyFlashcards(documentId?: string) {
    return prisma.flashcard.findMany({
        where: {
            isVocabulary: true,
            ...(documentId ? { documentId } : {}),
        },
        include: {
            document: { select: { id: true, title: true, subject: true } },
            progress: true,
        },
        orderBy: { createdAt: 'desc' },
    })
}

// Get due vocabulary flashcards
export async function getDueVocabularyFlashcards(limit: number = 20) {
    return prisma.flashcard.findMany({
        where: {
            isVocabulary: true,
            OR: [
                { progress: null },
                { progress: { nextReviewAt: { lte: new Date() } } },
            ],
        },
        include: {
            document: { select: { id: true, title: true, subject: true } },
            chunk: { select: { id: true, content: true, chunkIndex: true } },
            progress: true,
        },
        take: limit,
        orderBy: { createdAt: 'asc' },
    })
}

// Count due vocabulary flashcards
export async function getDueVocabularyCount() {
    const [newCards, dueCards] = await Promise.all([
        prisma.flashcard.count({ where: { isVocabulary: true, progress: null } }),
        prisma.flashcard.count({
            where: {
                isVocabulary: true,
                progress: { nextReviewAt: { lte: new Date() } },
            },
        }),
    ])
    return newCards + dueCards
}

// Aggregate flashcard progress per document (for dashboard chart)
export async function getFlashcardDocumentProgress() {
    const documents = await prisma.document.findMany({
        where: {
            flashcards: {
                some: {
                    progress: { isNot: null },
                },
            },
        },
        select: {
            id: true,
            title: true,
            flashcards: {
                select: {
                    id: true,
                    progress: {
                        select: {
                            repetitions: true,
                        },
                    },
                },
            },
        },
    })

    return documents.map((doc) => {
        const total = doc.flashcards.length
        const reviewed = doc.flashcards.filter((f) => f.progress !== null)
        const mastered = reviewed.filter((f) => f.progress!.repetitions >= 3).length
        const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0

        return {
            documentId: doc.id,
            documentTitle: doc.title,
            totalQuestions: total,
            answeredQuestions: reviewed.length,
            percentage,
        }
    })
}
