import { prisma } from '@/src/lib/prisma'

// Reviews per day for heatmap
export async function getVocabReviewHeatmap(days: number = 180) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const rows = await prisma.reviewLog.groupBy({
        by: ['reviewedAt'],
        _count: { id: true },
        where: { reviewedAt: { gte: since } },
        orderBy: { reviewedAt: 'asc' },
    })

    // Aggregate by date string
    const dateMap = new Map<string, number>()
    for (const row of rows) {
        const dateStr = new Date(row.reviewedAt).toISOString().split('T')[0]
        dateMap.set(dateStr, (dateMap.get(dateStr) ?? 0) + row._count.id)
    }

    return [...dateMap.entries()].map(([date, count]) => ({ date, count }))
}

// Retention curve: retention rate by days since first review
export async function getRetentionCurve() {
    const logs = await prisma.reviewLog.findMany({
        select: {
            flashcardId: true,
            rating: true,
            reviewedAt: true,
        },
        orderBy: { reviewedAt: 'asc' },
    })

    // Group by flashcard, compute first review, then retention at each subsequent review
    const cardFirstReview = new Map<string, Date>()
    const buckets = new Map<number, { correct: number; total: number }>()

    for (const log of logs) {
        if (!cardFirstReview.has(log.flashcardId)) {
            cardFirstReview.set(log.flashcardId, log.reviewedAt)
            continue
        }
        const first = cardFirstReview.get(log.flashcardId)!
        const daysSince = Math.floor((log.reviewedAt.getTime() - first.getTime()) / (1000 * 60 * 60 * 24))
        const bucket = buckets.get(daysSince) ?? { correct: 0, total: 0 }
        bucket.total++
        if (log.rating >= 3) bucket.correct++
        buckets.set(daysSince, bucket)
    }

    return [...buckets.entries()]
        .filter(([, b]) => b.total >= 2)
        .sort(([a], [b]) => a - b)
        .map(([daysSinceFirstReview, b]) => ({
            daysSinceFirstReview,
            retentionRate: Math.round((b.correct / b.total) * 100),
            sampleSize: b.total,
        }))
}

// Words with most lapses / "Again" ratings
export async function getDifficultWords(limit: number = 20) {
    const rows = await prisma.reviewLog.groupBy({
        by: ['flashcardId'],
        _count: { id: true },
        _sum: { rating: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit * 2,
    })

    // Compute per-card stats with again count
    const cardIds = rows.map(r => r.flashcardId)
    const [cards, againCounts] = await Promise.all([
        prisma.flashcard.findMany({
            where: { id: { in: cardIds } },
            select: { id: true, front: true, back: true },
        }),
        prisma.reviewLog.groupBy({
            by: ['flashcardId'],
            where: { flashcardId: { in: cardIds }, rating: 1 },
            _count: { id: true },
        }),
    ])

    const cardMap = new Map(cards.map(c => [c.id, c]))
    const againMap = new Map(againCounts.map(a => [a.flashcardId, a._count.id]))

    return rows
        .map(r => {
            const card = cardMap.get(r.flashcardId)
            if (!card) return null
            const againCount = againMap.get(r.flashcardId) ?? 0
            return {
                flashcardId: r.flashcardId,
                front: card.front,
                back: card.back,
                againCount,
                totalReviews: r._count.id,
            }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .sort((a, b) => b.againCount - a.againCount)
        .slice(0, limit)
}

// Due forecast: how many cards are due per day in the next N days
export async function getDueForecast(days: number = 14) {
    const now = new Date()
    const end = new Date()
    end.setDate(end.getDate() + days)

    const rows = await prisma.flashcardProgress.findMany({
        where: {
            due: { gte: now, lte: end },
        },
        select: { due: true },
    })

    const dateMap = new Map<string, number>()
    for (const row of rows) {
        const dateStr = new Date(row.due).toISOString().split('T')[0]
        dateMap.set(dateStr, (dateMap.get(dateStr) ?? 0) + 1)
    }

    // Fill gaps
    const result: { date: string; count: number }[] = []
    for (let i = 0; i <= days; i++) {
        const d = new Date(now)
        d.setDate(d.getDate() + i)
        const dateStr = d.toISOString().split('T')[0]
        result.push({ date: dateStr, count: dateMap.get(dateStr) ?? 0 })
    }

    return result
}
