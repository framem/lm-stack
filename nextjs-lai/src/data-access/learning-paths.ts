import { prisma } from '@/src/lib/prisma'

// Learner profile per document
export interface DocumentProfile {
    documentId: string
    documentTitle: string
    subject: string | null
    quizCount: number
    flashcardCount: number
    avgScore: number
    totalAttempts: number
    dueItems: number
    lastActivityAt: Date | null
    weakChunkCount: number
}

// Overall learner profile
export interface LearnerProfile {
    documents: DocumentProfile[]
    totalDocuments: number
    totalAttempts: number
    avgScore: number
    currentStreak: number
    prioritizedDocuments: DocumentProfile[] // sorted by urgency
}

// Get aggregated learner profile
export async function getLearnerProfile(): Promise<LearnerProfile> {
    const [documents, userStats] = await Promise.all([
        prisma.document.findMany({
            include: {
                quizzes: {
                    include: {
                        questions: {
                            include: {
                                attempts: {
                                    orderBy: { createdAt: 'desc' as const },
                                    take: 1,
                                    select: { isCorrect: true, freeTextScore: true, createdAt: true },
                                },
                                progress: {
                                    select: { nextReviewAt: true },
                                },
                            },
                        },
                    },
                },
                flashcards: {
                    include: {
                        progress: {
                            select: { nextReviewAt: true, repetitions: true },
                        },
                    },
                },
                chunks: {
                    select: { id: true },
                },
            },
        }),
        prisma.userStats.findFirst(),
    ])

    const now = new Date()
    let globalTotalAttempts = 0
    let globalTotalScore = 0

    const docProfiles: DocumentProfile[] = documents
        .filter((doc) => doc.quizzes.length > 0 || doc.flashcards.length > 0)
        .map((doc) => {
            let totalScore = 0
            let totalAttempts = 0
            let dueItems = 0
            let lastActivity: Date | null = null
            let weakChunks = 0

            // Quiz data
            for (const quiz of doc.quizzes) {
                for (const q of quiz.questions) {
                    if (q.progress && q.progress.nextReviewAt <= now) dueItems++

                    if (q.attempts.length > 0) {
                        const attempt = q.attempts[0]
                        const score = q.questionType === 'freetext'
                            ? (attempt.freeTextScore ?? (attempt.isCorrect ? 1 : 0))
                            : (attempt.isCorrect ? 1 : 0)
                        totalScore += score
                        totalAttempts++

                        if (score < 0.5) weakChunks++

                        if (!lastActivity || attempt.createdAt > lastActivity) {
                            lastActivity = attempt.createdAt
                        }
                    }
                }
            }

            // Flashcard data
            for (const fc of doc.flashcards) {
                if (!fc.progress) {
                    dueItems++
                } else if (fc.progress.nextReviewAt <= now) {
                    dueItems++
                }
            }

            globalTotalAttempts += totalAttempts
            globalTotalScore += totalScore

            return {
                documentId: doc.id,
                documentTitle: doc.title,
                subject: doc.subject,
                quizCount: doc.quizzes.length,
                flashcardCount: doc.flashcards.length,
                avgScore: totalAttempts > 0 ? Math.round((totalScore / totalAttempts) * 100) : 0,
                totalAttempts,
                dueItems,
                lastActivityAt: lastActivity,
                weakChunkCount: weakChunks,
            }
        })

    // Prioritize: lowest score first, then most due items, then oldest activity
    const prioritized = [...docProfiles].sort((a, b) => {
        // Documents with attempts but low score first
        if (a.totalAttempts > 0 && b.totalAttempts > 0) {
            if (a.avgScore !== b.avgScore) return a.avgScore - b.avgScore
        }
        // Then by due items (more due = higher priority)
        if (a.dueItems !== b.dueItems) return b.dueItems - a.dueItems
        // Then by last activity (older = higher priority)
        if (a.lastActivityAt && b.lastActivityAt) {
            return a.lastActivityAt.getTime() - b.lastActivityAt.getTime()
        }
        return 0
    })

    return {
        documents: docProfiles,
        totalDocuments: docProfiles.length,
        totalAttempts: globalTotalAttempts,
        avgScore: globalTotalAttempts > 0
            ? Math.round((globalTotalScore / globalTotalAttempts) * 100)
            : 0,
        currentStreak: userStats?.currentStreak ?? 0,
        prioritizedDocuments: prioritized,
    }
}

// Get weak chunks for a specific document
export interface WeakChunk {
    chunkId: string
    chunkIndex: number
    avgScore: number
    attemptCount: number
}

export async function getWeakChunksForDocument(documentId: string): Promise<WeakChunk[]> {
    const questions = await prisma.quizQuestion.findMany({
        where: {
            quiz: { documentId },
            sourceChunkId: { not: null },
            attempts: { some: {} },
        },
        select: {
            sourceChunkId: true,
            sourceChunk: {
                select: { chunkIndex: true },
            },
            attempts: {
                orderBy: { createdAt: 'desc' as const },
                take: 1,
                select: { isCorrect: true, freeTextScore: true },
            },
            questionType: true,
        },
    })

    // Group by chunk
    const chunkMap = new Map<string, { chunkIndex: number; scores: number[] }>()

    for (const q of questions) {
        if (!q.sourceChunkId || !q.sourceChunk) continue
        const entry = chunkMap.get(q.sourceChunkId) ?? {
            chunkIndex: q.sourceChunk.chunkIndex,
            scores: [],
        }
        if (q.attempts.length > 0) {
            const attempt = q.attempts[0]
            const score = q.questionType === 'freetext'
                ? (attempt.freeTextScore ?? (attempt.isCorrect ? 1 : 0))
                : (attempt.isCorrect ? 1 : 0)
            entry.scores.push(score)
        }
        chunkMap.set(q.sourceChunkId, entry)
    }

    return [...chunkMap.entries()]
        .map(([chunkId, data]) => ({
            chunkId,
            chunkIndex: data.chunkIndex,
            avgScore: data.scores.length > 0
                ? Math.round((data.scores.reduce((s, v) => s + v, 0) / data.scores.length) * 100)
                : 0,
            attemptCount: data.scores.length,
        }))
        .filter((c) => c.avgScore < 70) // Only weak chunks
        .sort((a, b) => a.avgScore - b.avgScore)
}
