import { prisma } from '@/src/lib/prisma'
import { progressToCard, scheduleReview, getSchedulingOptions, formatInterval, Rating } from '@/src/lib/spaced-repetition'

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
            document: { select: { id: true, title: true, subject: true } },
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
export async function getDueFlashcards(limit: number = 20, excludeVocabulary?: boolean) {
    return prisma.flashcard.findMany({
        where: {
            ...(excludeVocabulary ? { isVocabulary: false } : {}),
            OR: [
                // New cards — no progress record yet
                { progress: null },
                // Reviewed cards that are due
                { progress: { due: { lte: new Date() } } },
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

// Get due flashcards for a specific language (vocabulary only)
export async function getDueFlashcardsForLanguage(language: string, limit: number = 20) {
    return prisma.flashcard.findMany({
        where: {
            isVocabulary: true,
            document: { subject: language, fileType: 'language-set' },
            OR: [
                { progress: null },
                { progress: { due: { lte: new Date() } } },
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

// Count due vocabulary flashcards grouped by language
export async function getDueVocabularyCountByLanguage(): Promise<Record<string, number>> {
    const docs = await prisma.document.findMany({
        where: {
            fileType: 'language-set',
            flashcards: {
                some: {
                    isVocabulary: true,
                    OR: [
                        { progress: null },
                        { progress: { due: { lte: new Date() } } },
                    ],
                },
            },
        },
        select: {
            subject: true,
            flashcards: {
                where: {
                    isVocabulary: true,
                    OR: [
                        { progress: null },
                        { progress: { due: { lte: new Date() } } },
                    ],
                },
                select: { id: true },
            },
        },
    })

    const result: Record<string, number> = {}
    for (const doc of docs) {
        if (doc.subject) {
            result[doc.subject] = (result[doc.subject] ?? 0) + doc.flashcards.length
        }
    }
    return result
}

// Count due document-based flashcards (excludes vocabulary)
export async function getDueDocumentFlashcardCount() {
    const [newCards, dueCards] = await Promise.all([
        prisma.flashcard.count({ where: { isVocabulary: false, progress: null } }),
        prisma.flashcard.count({
            where: {
                isVocabulary: false,
                progress: { due: { lte: new Date() } },
            },
        }),
    ])
    return newCards + dueCards
}

// Count of due flashcards (includes new cards without progress)
export async function getDueFlashcardCount() {
    const [newCards, dueCards] = await Promise.all([
        prisma.flashcard.count({ where: { progress: null } }),
        prisma.flashcardProgress.count({ where: { due: { lte: new Date() } } }),
    ])
    return newCards + dueCards
}

// Upsert flashcard progress using FSRS
export async function upsertFlashcardProgress(flashcardId: string, rating: Rating) {
    const existing = await prisma.flashcardProgress.findUnique({
        where: { flashcardId },
    })

    const card = progressToCard(existing)
    const now = new Date()
    const result = scheduleReview(card, rating, now)
    const next = result.card

    const progressData = {
        // FSRS fields
        stability: next.stability,
        difficulty: next.difficulty,
        elapsedDays: next.elapsed_days,
        scheduledDays: next.scheduled_days,
        reps: next.reps,
        lapses: next.lapses,
        state: next.state as number,
        due: next.due,
        lastReview: now,
        // Legacy SM-2 fields (kept in sync for transition)
        easeFactor: 2.5,
        interval: Math.max(1, next.scheduled_days),
        repetitions: next.reps,
        nextReviewAt: next.due,
        lastReviewedAt: now,
    }

    const [progress] = await prisma.$transaction([
        prisma.flashcardProgress.upsert({
            where: { flashcardId },
            create: { flashcardId, ...progressData },
            update: progressData,
        }),
        prisma.reviewLog.create({
            data: {
                flashcardId,
                rating: rating as number,
                state: next.state as number,
                stability: next.stability,
                difficulty: next.difficulty,
                elapsedDays: next.elapsed_days,
                scheduledDays: next.scheduled_days,
            },
        }),
    ])

    return progress
}

// Get scheduling preview (interval labels) for all 4 rating buttons
export async function getFlashcardSchedulingPreview(flashcardId: string) {
    const existing = await prisma.flashcardProgress.findUnique({
        where: { flashcardId },
    })

    const card = progressToCard(existing)
    const options = getSchedulingOptions(card)

    return {
        [Rating.Again]: formatInterval(options[Rating.Again].card.scheduled_days),
        [Rating.Hard]: formatInterval(options[Rating.Hard].card.scheduled_days),
        [Rating.Good]: formatInterval(options[Rating.Good].card.scheduled_days),
        [Rating.Easy]: formatInterval(options[Rating.Easy].card.scheduled_days),
    }
}

// Update a flashcard
export async function updateFlashcard(id: string, data: Partial<Pick<CreateFlashcardInput, 'front' | 'back' | 'context'>>) {
    return prisma.flashcard.update({
        where: { id },
        data,
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

// Get vocabulary flashcards, optionally filtered by document, language, or category
export async function getVocabularyFlashcards(documentId?: string, language?: string, category?: string) {
    return prisma.flashcard.findMany({
        where: {
            isVocabulary: true,
            ...(documentId ? { documentId } : {}),
            ...(language ? { document: { subject: language, fileType: 'language-set' } } : {}),
            ...(category ? { context: category } : {}),
        },
        include: {
            document: { select: { id: true, title: true, subject: true, fileType: true } },
            progress: true,
        },
        orderBy: { createdAt: 'desc' },
    })
}

// Get due vocabulary flashcards (new + overdue), optionally filtered to one document/category
export async function getDueVocabularyFlashcards(limit: number = 20, documentId?: string, category?: string) {
    return prisma.flashcard.findMany({
        where: {
            isVocabulary: true,
            ...(documentId ? { documentId } : {}),
            ...(category ? { context: category } : {}),
            OR: [
                { progress: null },
                { progress: { due: { lte: new Date() } } },
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

// Get new (never-reviewed) vocabulary flashcards only, optionally filtered to one document/category
export async function getNewVocabularyFlashcards(limit: number = 20, documentId?: string, category?: string) {
    return prisma.flashcard.findMany({
        where: {
            isVocabulary: true,
            ...(documentId ? { documentId } : {}),
            ...(category ? { context: category } : {}),
            progress: null,
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

// Search flashcards by front or back text
export async function searchFlashcards(query: string) {
    return prisma.flashcard.findMany({
        where: {
            OR: [
                { front: { contains: query, mode: 'insensitive' } },
                { back:  { contains: query, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            front: true,
            back: true,
            document: { select: { id: true, title: true } },
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
    })
}

// Count due vocabulary flashcards
export async function getDueVocabularyCount() {
    const [newCards, dueCards] = await Promise.all([
        prisma.flashcard.count({ where: { isVocabulary: true, progress: null } }),
        prisma.flashcard.count({
            where: {
                isVocabulary: true,
                progress: { due: { lte: new Date() } },
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
                            reps: true,
                        },
                    },
                },
            },
        },
    })

    return documents.map((doc) => {
        const total = doc.flashcards.length
        const reviewed = doc.flashcards.filter((f) => f.progress !== null)
        const mastered = reviewed.filter((f) => f.progress!.reps >= 3).length
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

// Get distinct languages from vocabulary documents (language-set documents)
export async function getVocabularyLanguages() {
    const docs = await prisma.document.findMany({
        where: {
            fileType: 'language-set',
            flashcards: {
                some: {
                    isVocabulary: true,
                },
            },
        },
        select: {
            subject: true,
        },
        distinct: ['subject'],
        orderBy: {
            subject: 'asc',
        },
    })

    return docs.map(d => d.subject).filter((s): s is string => s !== null)
}
