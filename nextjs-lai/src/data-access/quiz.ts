import { prisma } from '@/src/lib/prisma'
import { sm2, quizQualityFromAnswer } from '@/src/lib/spaced-repetition'
import { isFreetextLikeType } from '@/src/lib/quiz-types'

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
}

// Create a new quiz for a document
export async function createQuiz(title: string, documentId: string) {
    return prisma.quiz.create({
        data: { title, documentId },
    })
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

// Upsert question progress using SM-2 after answering
export async function upsertQuestionProgress(
    questionId: string,
    isCorrect: boolean,
    freeTextScore?: number | null,
) {
    const quality = quizQualityFromAnswer(isCorrect, freeTextScore)

    const existing = await prisma.questionProgress.findUnique({
        where: { questionId },
    })

    const result = sm2({
        quality,
        easeFactor: existing?.easeFactor ?? 2.5,
        interval: existing?.interval ?? 1,
        repetitions: existing?.repetitions ?? 0,
    })

    return prisma.questionProgress.upsert({
        where: { questionId },
        create: {
            questionId,
            easeFactor: result.easeFactor,
            interval: result.interval,
            repetitions: result.repetitions,
            nextReviewAt: result.nextReviewAt,
            lastReviewedAt: new Date(),
        },
        update: {
            easeFactor: result.easeFactor,
            interval: result.interval,
            repetitions: result.repetitions,
            nextReviewAt: result.nextReviewAt,
            lastReviewedAt: new Date(),
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
