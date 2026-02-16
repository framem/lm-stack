import { prisma } from '@/src/lib/prisma'

// Aggregated overview per subject
export interface SubjectOverviewItem {
    subject: string
    documentCount: number
    quizCount: number
    flashcardCount: number
    dueReviews: number
    avgProgress: number
    lastActivityAt: Date | null
}

// Get overview stats for all subjects
export async function getSubjectOverview(): Promise<SubjectOverviewItem[]> {
    const subjects = await prisma.document.findMany({
        where: { subject: { not: null } },
        select: {
            id: true,
            subject: true,
            quizzes: {
                select: {
                    id: true,
                    questions: {
                        select: {
                            id: true,
                            questionType: true,
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
                select: {
                    id: true,
                    progress: {
                        select: { nextReviewAt: true, repetitions: true },
                    },
                },
            },
        },
    })

    // Group by subject
    const map = new Map<string, {
        docIds: Set<string>
        quizCount: number
        flashcardCount: number
        dueReviews: number
        totalScore: number
        totalAnswered: number
        lastActivity: Date | null
    }>()

    const now = new Date()

    for (const doc of subjects) {
        const subj = doc.subject!
        if (!map.has(subj)) {
            map.set(subj, {
                docIds: new Set(),
                quizCount: 0,
                flashcardCount: 0,
                dueReviews: 0,
                totalScore: 0,
                totalAnswered: 0,
                lastActivity: null,
            })
        }
        const entry = map.get(subj)!
        entry.docIds.add(doc.id)
        entry.quizCount += doc.quizzes.length
        entry.flashcardCount += doc.flashcards.length

        // Quiz progress + due reviews
        for (const quiz of doc.quizzes) {
            for (const q of quiz.questions) {
                if (q.progress && q.progress.nextReviewAt <= now) {
                    entry.dueReviews++
                }
                if (q.attempts.length > 0) {
                    const attempt = q.attempts[0]
                    if (q.questionType === 'freetext') {
                        entry.totalScore += attempt.freeTextScore ?? (attempt.isCorrect ? 1 : 0)
                    } else {
                        entry.totalScore += attempt.isCorrect ? 1 : 0
                    }
                    entry.totalAnswered++
                    if (!entry.lastActivity || attempt.createdAt > entry.lastActivity) {
                        entry.lastActivity = attempt.createdAt
                    }
                }
            }
        }

        // Flashcard due reviews
        for (const fc of doc.flashcards) {
            if (!fc.progress) {
                entry.dueReviews++ // New cards count as due
            } else if (fc.progress.nextReviewAt <= now) {
                entry.dueReviews++
            }
            // Count mastered for progress
            if (fc.progress && fc.progress.repetitions >= 3) {
                entry.totalScore++
                entry.totalAnswered++
            } else if (fc.progress) {
                entry.totalAnswered++
            }
        }
    }

    return [...map.entries()].map(([subject, data]) => ({
        subject,
        documentCount: data.docIds.size,
        quizCount: data.quizCount,
        flashcardCount: data.flashcardCount,
        dueReviews: data.dueReviews,
        avgProgress: data.totalAnswered > 0
            ? Math.round((data.totalScore / data.totalAnswered) * 100)
            : 0,
        lastActivityAt: data.lastActivity,
    }))
}

// Detailed data for a single subject
export interface SubjectDetail {
    subject: string
    documents: Array<{
        id: string
        title: string
        createdAt: Date
        quizCount: number
        flashcardCount: number
        progress: number
    }>
    totalQuizzes: number
    totalFlashcards: number
    dueReviews: number
    recentQuizzes: Array<{
        id: string
        title: string
        createdAt: Date
        questionCount: number
        documentTitle: string
    }>
}

export async function getSubjectDetail(subject: string): Promise<SubjectDetail | null> {
    const documents = await prisma.document.findMany({
        where: { subject },
        orderBy: { createdAt: 'desc' },
        include: {
            quizzes: {
                orderBy: { createdAt: 'desc' },
                include: {
                    questions: {
                        select: {
                            id: true,
                            questionType: true,
                            attempts: {
                                orderBy: { createdAt: 'desc' as const },
                                take: 1,
                                select: { isCorrect: true, freeTextScore: true },
                            },
                            progress: {
                                select: { nextReviewAt: true },
                            },
                        },
                    },
                },
            },
            flashcards: {
                select: {
                    id: true,
                    progress: {
                        select: { nextReviewAt: true, repetitions: true },
                    },
                },
            },
        },
    })

    if (documents.length === 0) return null

    const now = new Date()
    let totalDue = 0
    let totalQuizzes = 0
    let totalFlashcards = 0

    const recentQuizzes: SubjectDetail['recentQuizzes'] = []

    const docResults = documents.map((doc) => {
        totalQuizzes += doc.quizzes.length
        totalFlashcards += doc.flashcards.length

        // Compute progress per document
        let score = 0
        let answered = 0

        for (const quiz of doc.quizzes) {
            recentQuizzes.push({
                id: quiz.id,
                title: quiz.title,
                createdAt: quiz.createdAt,
                questionCount: quiz.questions.length,
                documentTitle: doc.title,
            })

            for (const q of quiz.questions) {
                if (q.progress && q.progress.nextReviewAt <= now) totalDue++
                if (q.attempts.length > 0) {
                    const attempt = q.attempts[0]
                    if (q.questionType === 'freetext') {
                        score += attempt.freeTextScore ?? (attempt.isCorrect ? 1 : 0)
                    } else {
                        score += attempt.isCorrect ? 1 : 0
                    }
                    answered++
                }
            }
        }

        for (const fc of doc.flashcards) {
            if (!fc.progress) {
                totalDue++
            } else if (fc.progress.nextReviewAt <= now) {
                totalDue++
            }
        }

        return {
            id: doc.id,
            title: doc.title,
            createdAt: doc.createdAt,
            quizCount: doc.quizzes.length,
            flashcardCount: doc.flashcards.length,
            progress: answered > 0 ? Math.round((score / answered) * 100) : 0,
        }
    })

    // Sort recent quizzes by date, take top 5
    recentQuizzes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return {
        subject,
        documents: docResults,
        totalQuizzes,
        totalFlashcards,
        dueReviews: totalDue,
        recentQuizzes: recentQuizzes.slice(0, 5),
    }
}
