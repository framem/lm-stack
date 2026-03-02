import { prisma } from '@/src/lib/prisma'

export type ActivityType = 'flashcards' | 'quiz' | 'vocabulary' | 'reading' | 'chat' | 'writing' | 'grammar' | 'exam' | 'pronunciation'

// Start a new learning session
export async function startSession(activityType: ActivityType) {
    return prisma.learningSession.create({
        data: { activityType },
    })
}

// Heartbeat: update timestamp so we know the session is still active
export async function heartbeatSession(sessionId: string) {
    return prisma.learningSession.update({
        where: { id: sessionId },
        data: { heartbeatAt: new Date() },
    })
}

// End a session: compute duration from start to now
export async function endSession(sessionId: string) {
    const session = await prisma.learningSession.findUnique({
        where: { id: sessionId },
    })
    if (!session || session.endedAt) return null

    const now = new Date()
    const durationSeconds = Math.round((now.getTime() - session.startedAt.getTime()) / 1000)

    return prisma.learningSession.update({
        where: { id: sessionId },
        data: { endedAt: now, durationSeconds },
    })
}

// Close stale sessions (heartbeat older than 2 minutes)
export async function closeStaleSession() {
    const cutoff = new Date()
    cutoff.setMinutes(cutoff.getMinutes() - 2)

    const stale = await prisma.learningSession.findMany({
        where: {
            endedAt: null,
            heartbeatAt: { lt: cutoff },
        },
    })

    for (const session of stale) {
        const durationSeconds = Math.round(
            (session.heartbeatAt.getTime() - session.startedAt.getTime()) / 1000
        )
        await prisma.learningSession.update({
            where: { id: session.id },
            data: { endedAt: session.heartbeatAt, durationSeconds },
        })
    }
}

export interface DailyLearningTime {
    date: string
    minutes: number
    byActivity: Record<string, number>
}

// Get daily learning time for the last N days
export async function getDailyLearningTime(days: number = 30): Promise<DailyLearningTime[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    // Close stale sessions first
    await closeStaleSession()

    const sessions = await prisma.learningSession.findMany({
        where: {
            startedAt: { gte: since },
            durationSeconds: { not: null },
        },
        select: {
            activityType: true,
            startedAt: true,
            durationSeconds: true,
        },
        orderBy: { startedAt: 'asc' },
    })

    // Aggregate by date
    const dateMap = new Map<string, { total: number; byActivity: Record<string, number> }>()

    for (const session of sessions) {
        const dateStr = session.startedAt.toISOString().split('T')[0]
        const entry = dateMap.get(dateStr) ?? { total: 0, byActivity: {} }
        const seconds = session.durationSeconds ?? 0
        entry.total += seconds
        entry.byActivity[session.activityType] =
            (entry.byActivity[session.activityType] ?? 0) + seconds
        dateMap.set(dateStr, entry)
    }

    // Fill gaps for all days
    const result: DailyLearningTime[] = []
    for (let i = days; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const entry = dateMap.get(dateStr)
        result.push({
            date: dateStr,
            minutes: entry ? Math.round(entry.total / 60) : 0,
            byActivity: entry
                ? Object.fromEntries(
                    Object.entries(entry.byActivity).map(([k, v]) => [k, Math.round(v / 60)])
                )
                : {},
        })
    }

    return result
}

// Get weekly average learning time in minutes
export async function getWeeklyAverageLearningTime(): Promise<number> {
    const daily = await getDailyLearningTime(7)
    const total = daily.reduce((sum, d) => sum + d.minutes, 0)
    return Math.round(total / 7)
}

// Get total learning time today in minutes
export async function getTodayLearningTime(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await closeStaleSession()

    const sessions = await prisma.learningSession.findMany({
        where: {
            startedAt: { gte: today },
            durationSeconds: { not: null },
        },
        select: { durationSeconds: true },
    })

    const totalSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0)
    return Math.round(totalSeconds / 60)
}
