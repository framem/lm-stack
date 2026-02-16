import { prisma } from '@/src/lib/prisma'

// Singleton pattern: get or create the single UserStats record
// Returns dailyProgress as 0 if lastProgressDate is not today
export async function getOrCreateUserStats() {
    const existing = await prisma.userStats.findFirst()
    if (!existing) return prisma.userStats.create({ data: {} })

    // If progress is from a previous day, show 0 (will be reset on next activity)
    const today = toDateString(new Date())
    const lastProgress = existing.lastProgressDate ? toDateString(existing.lastProgressDate) : null
    if (lastProgress !== today) {
        return { ...existing, dailyProgress: 0 }
    }

    return existing
}

// Record a learning activity (quiz answer or flashcard review)
export async function recordActivity() {
    const stats = await getOrCreateUserStats()
    const now = new Date()
    const today = toDateString(now)
    const lastActivity = stats.lastActivityDate ? toDateString(stats.lastActivityDate) : null
    const lastProgress = stats.lastProgressDate ? toDateString(stats.lastProgressDate) : null

    // Reset daily progress if it's a new day
    let dailyProgress = stats.dailyProgress
    if (lastProgress !== today) {
        dailyProgress = 0
    }
    dailyProgress++

    let currentStreak = stats.currentStreak
    if (lastActivity === today) {
        // Same day — only increment progress
    } else if (lastActivity === toDateString(addDays(now, -1))) {
        // Yesterday — continue streak
        currentStreak++
    } else {
        // Gap or first activity — start new streak
        currentStreak = 1
    }

    const longestStreak = Math.max(stats.longestStreak, currentStreak)

    return prisma.userStats.update({
        where: { id: stats.id },
        data: {
            currentStreak,
            longestStreak,
            dailyProgress,
            lastActivityDate: now,
            lastProgressDate: now,
        },
    })
}

// Update the daily learning goal
export async function updateDailyGoal(goal: number) {
    const stats = await getOrCreateUserStats()
    return prisma.userStats.update({
        where: { id: stats.id },
        data: { dailyGoal: goal },
    })
}

// Helper: format date as YYYY-MM-DD for day comparison
function toDateString(date: Date): string {
    return date.toISOString().slice(0, 10)
}

// Helper: add days to a date
function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}
