import { prisma } from '@/src/lib/prisma'
import { computeEarnedBadges, serializeBadges, BADGES, type BadgeStats, type SerializedBadge, type SerializedBadgeWithProgress } from '@/src/lib/badges'

/** Gather badge stats from DB */
async function getBadgeStats(): Promise<BadgeStats> {
    const [
        totalVocab,
        masteredVocab,
        totalFlashcards,
        totalQuizzes,
        totalDocuments,
        userStats,
        quizAttempts,
    ] = await Promise.all([
        prisma.flashcard.count({ where: { isVocabulary: true } }),
        prisma.flashcard.count({
            where: { isVocabulary: true, progress: { repetitions: { gte: 3 } } },
        }),
        prisma.flashcard.count(),
        prisma.quiz.count(),
        prisma.document.count(),
        prisma.userStats.findFirst(),
        prisma.quizAttempt.findMany({
            select: { isCorrect: true },
            orderBy: { createdAt: 'desc' },
            take: 100,
        }),
    ])

    const quizCorrectRate =
        quizAttempts.length > 0
            ? Math.round(
                (quizAttempts.filter((a) => a.isCorrect).length / quizAttempts.length) * 100
            )
            : 0

    return {
        totalVocab,
        masteredVocab,
        totalQuizzes,
        quizCorrectRate,
        currentStreak: userStats?.currentStreak ?? 0,
        longestStreak: userStats?.longestStreak ?? 0,
        totalFlashcards,
        totalDocuments,
        totalXp: userStats?.totalXp ?? 0,
    }
}

/** Get badge stats from existing data and compute earned badges */
export async function getEarnedBadges(): Promise<SerializedBadge[]> {
    const stats = await getBadgeStats()
    const earnedBadges = computeEarnedBadges(stats)
    return serializeBadges(earnedBadges)
}

/** Get all badges with progress info (earned + unearned with current/target) */
export async function getAllBadgesWithProgress(): Promise<SerializedBadgeWithProgress[]> {
    const stats = await getBadgeStats()
    const earnedIds = new Set(
        computeEarnedBadges(stats).map((b) => b.id)
    )

    return BADGES.map((badge) => {
        const earned = earnedIds.has(badge.id)
        return {
            id: badge.id,
            icon: badge.icon,
            title: badge.title,
            description: badge.description,
            earned,
            ...(!earned && badge.progress ? { progress: badge.progress(stats) } : {}),
        }
    })
}
