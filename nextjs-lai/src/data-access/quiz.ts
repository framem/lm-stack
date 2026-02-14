import { prisma } from '@/src/lib/prisma'

// Types for quiz question creation
interface CreateQuestionInput {
    questionText: string
    options: string[]
    correctIndex: number
    explanation?: string
    sourceChunkId?: string
    sourceSnippet?: string
    questionIndex: number
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
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            sourceChunkId: q.sourceChunkId,
            sourceSnippet: q.sourceSnippet,
            questionIndex: q.questionIndex,
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
                select: { id: true, title: true },
            },
        },
    })
}

// Get all quizzes
export async function getQuizzes() {
    return prisma.quiz.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            document: { select: { id: true, title: true } },
            questions: { select: { id: true } },
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
    selectedIndex: number,
    isCorrect: boolean,
    explanation?: string
) {
    return prisma.quizAttempt.create({
        data: {
            questionId,
            selectedIndex,
            isCorrect,
            explanation,
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
                },
            },
        },
    })

    return quiz
}
