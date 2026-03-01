import { prisma } from '@/src/lib/prisma'

export interface DailyActivity {
    date: string
    quizAttempts: number
    flashcardReviews: number
    total: number
}

export interface WeeklyTrend {
    week: string
    avgScore: number
}

// Get daily activity for the last N days (quiz attempts + flashcard reviews per day)
export async function getDailyActivity(days: number = 90): Promise<DailyActivity[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const quizActivity = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "QuizAttempt"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
    `

    const flashcardActivity = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("lastReviewedAt") as date, COUNT(*) as count
        FROM "FlashcardProgress"
        WHERE "lastReviewedAt" >= ${since}
        GROUP BY DATE("lastReviewedAt")
    `

    // Merge into a single map
    const map = new Map<string, DailyActivity>()

    for (const row of quizActivity) {
        const dateStr = new Date(row.date).toISOString().split('T')[0]
        const existing = map.get(dateStr) || { date: dateStr, quizAttempts: 0, flashcardReviews: 0, total: 0 }
        existing.quizAttempts = Number(row.count)
        existing.total = existing.quizAttempts + existing.flashcardReviews
        map.set(dateStr, existing)
    }

    for (const row of flashcardActivity) {
        const dateStr = new Date(row.date).toISOString().split('T')[0]
        const existing = map.get(dateStr) || { date: dateStr, quizAttempts: 0, flashcardReviews: 0, total: 0 }
        existing.flashcardReviews = Number(row.count)
        existing.total = existing.quizAttempts + existing.flashcardReviews
        map.set(dateStr, existing)
    }

    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}

// Get weekly knowledge trend (average score over time)
export async function getKnowledgeTrend(weeks: number = 12): Promise<WeeklyTrend[]> {
    const since = new Date()
    since.setDate(since.getDate() - weeks * 7)

    const rows = await prisma.$queryRaw<{ week: string; avg_score: number }[]>`
        SELECT TO_CHAR(DATE_TRUNC('week', "createdAt"), 'IYYY-IW') as week,
               AVG(
                   CASE
                       WHEN "freeTextScore" IS NOT NULL THEN "freeTextScore"
                       WHEN "isCorrect" = true THEN 1.0
                       ELSE 0.0
                   END
               ) as avg_score
        FROM "QuizAttempt"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE_TRUNC('week', "createdAt"), TO_CHAR(DATE_TRUNC('week', "createdAt"), 'IYYY-IW')
        ORDER BY DATE_TRUNC('week', "createdAt")
    `

    return rows.map((r) => ({
        week: r.week,
        avgScore: Math.round(Number(r.avg_score) * 100),
    }))
}

