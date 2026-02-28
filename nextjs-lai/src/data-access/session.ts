import { getDueFlashcards, getDueVocabularyFlashcards, getDueFlashcardsForLanguage } from './flashcards'
import { getDueQuestions } from './quiz'

export type SessionMode = 'documents-only' | 'language' | 'all'

export interface CombinedItem {
    type: 'flashcard' | 'quiz'
    id: string
    data: unknown
    overdueBy: number // hours overdue (higher = more urgent)
}

// Get a mixed list of due flashcards and quiz questions sorted by urgency
export async function getCombinedDueItems(
    limit: number = 30,
    mode: SessionMode = 'all',
    language?: string,
): Promise<CombinedItem[]> {
    let flashcards: Awaited<ReturnType<typeof getDueFlashcards>>
    let questions: Awaited<ReturnType<typeof getDueQuestions>>

    if (mode === 'documents-only') {
        ;[flashcards, questions] = await Promise.all([
            getDueFlashcards(limit, true),
            getDueQuestions(limit, { excludeLanguageSets: true }),
        ])
    } else if (mode === 'language' && language) {
        ;[flashcards, questions] = await Promise.all([
            getDueFlashcardsForLanguage(language, limit),
            getDueQuestions(limit, { language }),
        ])
    } else {
        ;[flashcards, questions] = await Promise.all([
            getDueFlashcards(limit),
            getDueQuestions(limit),
        ])
    }

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

// Daily practice caps: keeps the session quick (~5-10 min) while showing enough to matter
const DAILY_VOCAB_CAP = 5
const DAILY_QUIZ_CAP = 3

/**
 * Get a curated daily practice set sorted by FSRS overdue urgency.
 * Caps at DAILY_VOCAB_CAP vocab cards + DAILY_QUIZ_CAP quiz questions so the
 * session stays quick (streak-keeper), not exhaustive like getCombinedDueItems.
 */
export async function getDailyPracticeItems(
    mode: SessionMode = 'all',
    language?: string,
): Promise<CombinedItem[]> {
    let vocabCards: Awaited<ReturnType<typeof getDueVocabularyFlashcards>>
    let questions: Awaited<ReturnType<typeof getDueQuestions>>

    if (mode === 'documents-only') {
        ;[vocabCards, questions] = await Promise.all([
            getDueFlashcards(DAILY_VOCAB_CAP, true) as ReturnType<typeof getDueVocabularyFlashcards>,
            getDueQuestions(DAILY_QUIZ_CAP, { excludeLanguageSets: true }),
        ])
    } else if (mode === 'language' && language) {
        ;[vocabCards, questions] = await Promise.all([
            getDueFlashcardsForLanguage(language, DAILY_VOCAB_CAP) as ReturnType<typeof getDueVocabularyFlashcards>,
            getDueQuestions(DAILY_QUIZ_CAP, { language }),
        ])
    } else {
        ;[vocabCards, questions] = await Promise.all([
            getDueVocabularyFlashcards(DAILY_VOCAB_CAP),
            getDueQuestions(DAILY_QUIZ_CAP),
        ])
    }

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

    // If no vocabulary flashcards in 'all' mode, fall back to general flashcards
    if (mode === 'all' && vocabCards.length === 0) {
        const generalCards = await getDueFlashcards(DAILY_VOCAB_CAP)
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
