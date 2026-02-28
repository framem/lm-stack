import { prisma } from '@/src/lib/prisma'
import { progressToCard, scheduleReview, quizQualityFromAnswer, Rating } from '@/src/lib/spaced-repetition'
import { isFreetextLikeType } from '@/src/lib/quiz-types'
import type { DifficultyLevel } from '@/src/lib/quiz-difficulty'

// Types for quiz question creation
interface CreateQuestionInput {
    questionText: string
    options: string[] | null
    correctIndex: number | null
    correctIndices?: number[] | null
    correctAnswer?: string
    explanation?: string
    sourceChunkId?: string
    sourceSnippet?: string
    questionIndex: number
    questionType?: string
    difficulty?: number
}

// Create a new quiz — either from a document or a conversation scenario
export async function createQuiz(
    title: string,
    source: { documentId: string } | { scenarioKey: string; scenarioLanguage: string },
) {
    const data = 'documentId' in source
        ? { title, documentId: source.documentId }
        : { title, scenarioKey: source.scenarioKey, scenarioLanguage: source.scenarioLanguage }
    return prisma.quiz.create({ data })
}

// Add questions to an existing quiz
export async function addQuestions(quizId: string, questions: CreateQuestionInput[]) {
    return prisma.quizQuestion.createMany({
        data: questions.map((q) => ({
            quizId,
            questionText: q.questionText,
            options: q.options ?? undefined,
            correctIndex: q.correctIndex ?? undefined,
            correctIndices: q.correctIndices ?? undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            sourceChunkId: q.sourceChunkId,
            sourceSnippet: q.sourceSnippet,
            questionIndex: q.questionIndex,
            questionType: q.questionType ?? 'singleChoice',
            difficulty: q.difficulty ?? 1,
        })),
    })
}

// Get a quiz with all its questions
export async function getQuizWithQuestions(quizId: string) {
    return prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            questions: {
                orderBy: { questionIndex: 'asc' },
            },
            document: {
                select: { id: true, title: true, subject: true },
            },
        },
    })
}

// Get all quizzes with latest attempt stats
export async function getQuizzes() {
    return prisma.quiz.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            document: { select: { id: true, title: true } },
            questions: {
                select: {
                    id: true,
                    questionType: true,
                    attempts: {
                        orderBy: { createdAt: 'desc' as const },
                        take: 1,
                        select: {
                            isCorrect: true,
                            freeTextScore: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
    })
}

// Get quizzes for a specific document
export async function getQuizzesByDocument(documentId: string) {
    return prisma.quiz.findMany({
        where: { documentId },
        orderBy: { createdAt: 'desc' },
        include: {
            questions: { select: { id: true } },
        },
    })
}

// Record a quiz attempt
export async function recordAttempt(
    questionId: string,
    selectedIndex: number | null,
    isCorrect: boolean,
    explanation?: string,
    freeTextAnswer?: string,
    freeTextScore?: number,
    freeTextFeedback?: string,
    selectedIndices?: number[] | null,
) {
    return prisma.quizAttempt.create({
        data: {
            questionId,
            selectedIndex,
            selectedIndices: selectedIndices ?? undefined,
            isCorrect,
            explanation,
            freeTextAnswer,
            freeTextScore,
            freeTextFeedback,
        },
    })
}

// Delete a quiz by ID
export async function deleteQuiz(id: string) {
    return prisma.quiz.delete({ where: { id } })
}

// Get knowledge progress per document (aggregated from quiz attempts)
export async function getDocumentProgress() {
    const documents = await prisma.document.findMany({
        where: {
            quizzes: {
                some: {
                    questions: {
                        some: {
                            attempts: { some: {} },
                        },
                    },
                },
            },
        },
        select: {
            id: true,
            title: true,
            quizzes: {
                select: {
                    questions: {
                        select: {
                            id: true,
                            questionType: true,
                            attempts: {
                                orderBy: { createdAt: 'desc' as const },
                                take: 1,
                                select: {
                                    isCorrect: true,
                                    freeTextScore: true,
                                    createdAt: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    return documents.map((doc) => {
        const questions = doc.quizzes.flatMap((q) => q.questions)
        const answered = questions.filter((q) => q.attempts.length > 0)
        let totalScore = 0
        let lastAttemptDate: Date | null = null

        for (const q of answered) {
            const attempt = q.attempts[0]
            if (isFreetextLikeType(q.questionType)) {
                totalScore += attempt.freeTextScore ?? (attempt.isCorrect ? 1 : 0)
            } else {
                totalScore += attempt.isCorrect ? 1 : 0
            }
            if (!lastAttemptDate || attempt.createdAt > lastAttemptDate) {
                lastAttemptDate = attempt.createdAt
            }
        }

        const percentage = answered.length > 0
            ? Math.round((totalScore / answered.length) * 100)
            : 0

        return {
            documentId: doc.id,
            documentTitle: doc.title,
            totalQuestions: questions.length,
            answeredQuestions: answered.length,
            correctScore: totalScore,
            percentage,
            lastAttemptAt: lastAttemptDate,
        }
    })
}

// Upsert question progress using FSRS after answering
export async function upsertQuestionProgress(
    questionId: string,
    isCorrect: boolean,
    freeTextScore?: number | null,
) {
    const rating = quizQualityFromAnswer(isCorrect, freeTextScore)

    const existing = await prisma.questionProgress.findUnique({
        where: { questionId },
    })

    // Build a minimal FSRS card from existing SM-2 progress
    const card = progressToCard(existing ? {
        stability: 0,
        difficulty: 0,
        elapsedDays: existing.interval,
        scheduledDays: existing.interval,
        reps: existing.repetitions,
        lapses: 0,
        state: existing.repetitions === 0 ? 0 : 2,
        due: existing.nextReviewAt,
        lastReview: existing.lastReviewedAt,
    } : null)

    const now = new Date()
    const result = scheduleReview(card, rating, now)
    const next = result.card

    return prisma.questionProgress.upsert({
        where: { questionId },
        create: {
            questionId,
            easeFactor: 2.5,
            interval: Math.max(1, next.scheduled_days),
            repetitions: next.reps,
            nextReviewAt: next.due,
            lastReviewedAt: now,
        },
        update: {
            easeFactor: 2.5,
            interval: Math.max(1, next.scheduled_days),
            repetitions: next.reps,
            nextReviewAt: next.due,
            lastReviewedAt: now,
        },
    })
}

// Get questions due for review (nextReviewAt <= now)
export async function getDueQuestions(limit: number = 20) {
    return prisma.quizQuestion.findMany({
        where: {
            progress: {
                nextReviewAt: { lte: new Date() },
            },
        },
        include: {
            quiz: {
                select: { id: true, title: true, document: { select: { id: true, title: true } } },
            },
            progress: {
                select: { nextReviewAt: true },
            },
        },
        take: limit,
        orderBy: {
            progress: { nextReviewAt: 'asc' },
        },
    })
}

// Count of due review questions
export async function getDueReviewCount() {
    return prisma.questionProgress.count({
        where: {
            nextReviewAt: { lte: new Date() },
        },
    })
}

// Get a single quiz question by ID (with quiz for documentId)
export async function getQuizQuestionById(questionId: string) {
    return prisma.quizQuestion.findUnique({
        where: { id: questionId },
        include: {
            quiz: { select: { documentId: true } },
        },
    })
}

// Compute recommended difficulty for documents based on past performance
export async function getRecommendedDifficulty(documentIds: string[]): Promise<DifficultyLevel> {
    if (documentIds.length === 0) return 1

    const questions = await prisma.quizQuestion.findMany({
        where: {
            quiz: { documentId: { in: documentIds } },
            attempts: { some: {} },
        },
        select: {
            difficulty: true,
            attempts: {
                orderBy: { createdAt: 'desc' as const },
                take: 1,
                select: {
                    isCorrect: true,
                    freeTextScore: true,
                },
            },
            questionType: true,
        },
    })

    if (questions.length < 3) return 1

    // Compute accuracy per difficulty level
    const stats = new Map<number, { correct: number; total: number }>()
    for (const q of questions) {
        const a = q.attempts[0]
        if (!a) continue
        const d = q.difficulty
        const entry = stats.get(d) ?? { correct: 0, total: 0 }
        entry.total++
        const score = isFreetextLikeType(q.questionType)
            ? (a.freeTextScore ?? (a.isCorrect ? 1 : 0))
            : (a.isCorrect ? 1 : 0)
        entry.correct += score
        stats.set(d, entry)
    }

    // Find highest difficulty where accuracy >= 80%, then recommend one level higher
    let bestMastered = 0
    for (const [level, { correct, total }] of stats) {
        if (total >= 2 && (correct / total) >= 0.8) {
            bestMastered = Math.max(bestMastered, level)
        }
    }

    return Math.min(bestMastered + 1, 3) as DifficultyLevel
}

// Get results for a quiz (all attempts for its questions)
export async function getQuizResults(quizId: string) {
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            document: { select: { id: true, title: true } },
            questions: {
                orderBy: { questionIndex: 'asc' },
                include: {
                    attempts: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                    sourceChunk: {
                        select: { chunkIndex: true },
                    },
                },
            },
        },
    })

    return quiz
}

// Search quizzes by title
export async function searchQuizzes(query: string) {
    return prisma.quiz.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        select: {
            id: true,
            title: true,
            document: { select: { id: true, title: true } },
            _count: { select: { questions: true } },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
    })
}
