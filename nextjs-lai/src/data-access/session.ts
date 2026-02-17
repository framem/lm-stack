import { getDueFlashcards, getDueVocabularyFlashcards } from './flashcards'
import { getDueQuestions } from './quiz'

export interface CombinedItem {
    type: 'flashcard' | 'quiz'
    id: string
    data: unknown
    overdueBy: number // hours overdue (higher = more urgent)
}

// Get a mixed list of due flashcards and quiz questions sorted by urgency
export async function getCombinedDueItems(limit: number = 30): Promise<CombinedItem[]> {
    const [flashcards, questions] = await Promise.all([
        getDueFlashcards(limit),
        getDueQuestions(limit),
    ])

    const now = Date.now()
    const items: CombinedItem[] = []

    for (const fc of flashcards) {
        const nextReview = fc.progress?.nextReviewAt
        // New cards without progress get a default overdue of 0
        const overdueBy = nextReview
            ? Math.max(0, (now - new Date(nextReview).getTime()) / (1000 * 60 * 60))
            : 0
        items.push({
            type: 'flashcard',
            id: fc.id,
            data: fc,
            overdueBy,
        })
    }

    for (const q of questions) {
        // Quiz questions always have progress (that's how getDueQuestions works)
        const overdueBy = Math.max(0, (now - new Date(q.progress!.nextReviewAt).getTime()) / (1000 * 60 * 60))
        items.push({
            type: 'quiz',
            id: q.id,
            data: q,
            overdueBy,
        })
    }

    // Sort by overdue urgency (most overdue first)
    items.sort((a, b) => b.overdueBy - a.overdueBy)

    return items.slice(0, limit)
}

/**
 * Get a curated daily practice set: 2 due vocabulary flashcards + 1 quiz question.
 * Prioritized by SM-2 overdue urgency. Returns fewer items for a quick ~5 minute session.
 */
export async function getDailyPracticeItems(): Promise<CombinedItem[]> {
    const [vocabCards, questions] = await Promise.all([
        getDueVocabularyFlashcards(2),
        getDueQuestions(1),
    ])

    const now = Date.now()
    const items: CombinedItem[] = []

    for (const fc of vocabCards) {
        const nextReview = fc.progress?.nextReviewAt
        const overdueBy = nextReview
            ? Math.max(0, (now - new Date(nextReview).getTime()) / (1000 * 60 * 60))
            : 0
        items.push({ type: 'flashcard', id: fc.id, data: fc, overdueBy })
    }

    for (const q of questions) {
        const overdueBy = Math.max(0, (now - new Date(q.progress!.nextReviewAt).getTime()) / (1000 * 60 * 60))
        items.push({ type: 'quiz', id: q.id, data: q, overdueBy })
    }

    // If no vocabulary flashcards, fall back to general flashcards
    if (vocabCards.length === 0) {
        const generalCards = await getDueFlashcards(2)
        for (const fc of generalCards) {
            const nextReview = fc.progress?.nextReviewAt
            const overdueBy = nextReview
                ? Math.max(0, (now - new Date(nextReview).getTime()) / (1000 * 60 * 60))
                : 0
            items.push({ type: 'flashcard', id: fc.id, data: fc, overdueBy })
        }
    }

    items.sort((a, b) => b.overdueBy - a.overdueBy)
    return items
}
