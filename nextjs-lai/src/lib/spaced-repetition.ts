// FSRS spaced repetition algorithm (replaces SM-2)
import { fsrs, createEmptyCard, Rating, State, type Card, type RecordLogItem, type Grade } from 'ts-fsrs'

export { Rating, State }

const f = fsrs()

// Convert a DB progress record (or null for new card) to an FSRS Card
export function progressToCard(progress: {
    stability: number
    difficulty: number
    elapsedDays: number
    scheduledDays: number
    reps: number
    lapses: number
    state: number
    due: Date
    lastReview: Date | null
} | null): Card {
    if (!progress) return createEmptyCard()
    return {
        due: new Date(progress.due),
        stability: progress.stability,
        difficulty: progress.difficulty,
        elapsed_days: progress.elapsedDays,
        scheduled_days: progress.scheduledDays,
        reps: progress.reps,
        lapses: progress.lapses,
        state: progress.state as State,
        last_review: progress.lastReview ? new Date(progress.lastReview) : undefined,
        learning_steps: 0,
    }
}

// Schedule a review and return the result for a given rating
export function scheduleReview(card: Card, rating: Rating, now?: Date): RecordLogItem {
    return f.next(card, now ?? new Date(), rating as Grade)
}

// Get all 4 scheduling options (for button interval display)
export function getSchedulingOptions(card: Card, now?: Date) {
    const n = now ?? new Date()
    return {
        [Rating.Again]: f.next(card, n, Rating.Again as Grade),
        [Rating.Hard]: f.next(card, n, Rating.Hard as Grade),
        [Rating.Good]: f.next(card, n, Rating.Good as Grade),
        [Rating.Easy]: f.next(card, n, Rating.Easy as Grade),
    }
}

// Format a number of days into a human-readable German interval
export function formatInterval(days: number): string {
    if (days < 1 / 24) {
        const mins = Math.max(1, Math.round(days * 24 * 60))
        return `${mins} min`
    }
    if (days < 1) {
        const hours = Math.round(days * 24)
        return `${hours} h`
    }
    if (days < 30) {
        return `${Math.round(days)} T`
    }
    if (days < 365) {
        const months = days / 30
        return months >= 10 ? `${Math.round(months)} M` : `${months.toFixed(1)} M`
    }
    const years = days / 365
    return years >= 10 ? `${Math.round(years)} J` : `${years.toFixed(1)} J`
}

// Map quiz answer quality to FSRS Rating
export function quizQualityFromAnswer(isCorrect: boolean, freeTextScore?: number | null): Rating {
    if (freeTextScore !== undefined && freeTextScore !== null) {
        if (freeTextScore >= 0.8) return Rating.Good
        if (freeTextScore >= 0.5) return Rating.Hard
        return Rating.Again
    }
    return isCorrect ? Rating.Good : Rating.Again
}
