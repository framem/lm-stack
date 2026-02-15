// SM-2 spaced repetition algorithm
// Quality: 0-5 (0 = complete failure, 5 = perfect recall)

interface SM2Input {
    quality: number    // 0-5
    easeFactor: number // >= 1.3
    interval: number   // days
    repetitions: number
}

interface SM2Output {
    easeFactor: number
    interval: number
    repetitions: number
    nextReviewAt: Date
}

export function sm2(input: SM2Input): SM2Output {
    const { quality, easeFactor: prevEF, interval: prevInterval, repetitions: prevReps } = input

    let easeFactor: number
    let interval: number
    let repetitions: number

    if (quality >= 3) {
        // Correct response
        repetitions = prevReps + 1
        if (repetitions === 1) {
            interval = 1
        } else if (repetitions === 2) {
            interval = 6
        } else {
            interval = Math.round(prevInterval * prevEF)
        }
        // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        easeFactor = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    } else {
        // Incorrect — reset repetitions
        repetitions = 0
        interval = 1
        easeFactor = prevEF
    }

    // Ease factor never drops below 1.3
    easeFactor = Math.max(1.3, easeFactor)

    const nextReviewAt = new Date()
    nextReviewAt.setDate(nextReviewAt.getDate() + interval)

    return { easeFactor, interval, repetitions, nextReviewAt }
}

// Map quiz answer quality to SM-2 scale
export function quizQualityFromAnswer(isCorrect: boolean, freeTextScore?: number | null): number {
    if (freeTextScore !== undefined && freeTextScore !== null) {
        if (freeTextScore >= 0.8) return 5
        if (freeTextScore >= 0.5) return 3
        return 1
    }
    return isCorrect ? 5 : 1
}
