import { getDueFlashcards } from './flashcards'
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
