import { prisma } from '@/src/lib/prisma'
import { computeEarnedBadges, type BadgeStats, type EarnedBadge } from '@/src/lib/badges'

/** Get badge stats from existing data and compute earned badges */
export async function getEarnedBadges(): Promise<EarnedBadge[]> {
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
        // Get overall quiz correct rate from the most recent attempt per question
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

    const stats: BadgeStats = {
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

    return computeEarnedBadges(stats)
}
