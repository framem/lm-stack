import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockQuiz = {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
}

const mockQuizQuestion = {
    createMany: vi.fn(),
}

const mockQuizAttempt = {
    create: vi.fn(),
}

vi.mock('@/src/lib/prisma', () => ({
    prisma: {
        quiz: mockQuiz,
        quizQuestion: mockQuizQuestion,
        quizAttempt: mockQuizAttempt,
    },
}))

const {
    createQuiz,
    addQuestions,
    getQuizWithQuestions,
    getQuizzes,
    getQuizzesByDocument,
    recordAttempt,
    getQuizResults,
} = await import('@/src/data-access/quiz')

beforeEach(() => {
    vi.clearAllMocks()
})

describe('createQuiz', () => {
    it('should create a quiz with title and documentId', async () => {
        const quiz = { id: 'quiz-1', title: 'Test Quiz', documentId: 'doc-1' }
        mockQuiz.create.mockResolvedValue(quiz)

        const result = await createQuiz('Test Quiz', 'doc-1')

        expect(mockQuiz.create).toHaveBeenCalledWith({
            data: { title: 'Test Quiz', documentId: 'doc-1' },
        })
        expect(result).toEqual(quiz)
    })
})

describe('addQuestions', () => {
    it('should create multiple questions for a quiz', async () => {
        mockQuizQuestion.createMany.mockResolvedValue({ count: 2 })

        const questions = [
            {
                questionText: 'What is AI?',
                options: ['A', 'B', 'C', 'D'],
                correctIndex: 0,
                explanation: 'Because...',
                sourceSnippet: 'AI is...',
                questionIndex: 0,
            },
            {
                questionText: 'What is ML?',
                options: ['X', 'Y', 'Z', 'W'],
                correctIndex: 2,
                explanation: 'Because ML...',
                questionIndex: 1,
            },
        ]

        const result = await addQuestions('quiz-1', questions)

        expect(mockQuizQuestion.createMany).toHaveBeenCalledWith({
            data: [
                {
                    quizId: 'quiz-1',
                    questionText: 'What is AI?',
                    options: ['A', 'B', 'C', 'D'],
                    correctIndex: 0,
                    correctAnswer: undefined,
                    explanation: 'Because...',
                    sourceChunkId: undefined,
                    sourceSnippet: 'AI is...',
                    questionIndex: 0,
                    questionType: 'singleChoice',
                },
                {
                    quizId: 'quiz-1',
                    questionText: 'What is ML?',
                    options: ['X', 'Y', 'Z', 'W'],
                    correctIndex: 2,
                    correctAnswer: undefined,
                    explanation: 'Because ML...',
                    sourceChunkId: undefined,
                    sourceSnippet: undefined,
                    questionIndex: 1,
                    questionType: 'singleChoice',
                },
            ],
        })
        expect(result).toEqual({ count: 2 })
    })
})

describe('getQuizWithQuestions', () => {
    it('should return a quiz with ordered questions', async () => {
        const quiz = {
            id: 'quiz-1',
            title: 'Test',
            document: { id: 'doc-1', title: 'Doc' },
            questions: [{ id: 'q-1', questionIndex: 0 }],
        }
        mockQuiz.findUnique.mockResolvedValue(quiz)

        const result = await getQuizWithQuestions('quiz-1')

        expect(mockQuiz.findUnique).toHaveBeenCalledWith({
            where: { id: 'quiz-1' },
            include: {
                questions: { orderBy: { questionIndex: 'asc' } },
                document: { select: { id: true, title: true } },
            },
        })
        expect(result).toEqual(quiz)
    })

    it('should return null for non-existent quiz', async () => {
        mockQuiz.findUnique.mockResolvedValue(null)

        const result = await getQuizWithQuestions('nonexistent')

        expect(result).toBeNull()
    })
})

describe('getQuizzes', () => {
    it('should return all quizzes ordered by createdAt desc', async () => {
        const quizzes = [
            { id: 'quiz-2', title: 'Quiz 2', document: { id: 'doc-1', title: 'Doc' }, questions: [{ id: 'q-1' }] },
            { id: 'quiz-1', title: 'Quiz 1', document: { id: 'doc-1', title: 'Doc' }, questions: [] },
        ]
        mockQuiz.findMany.mockResolvedValue(quizzes)

        const result = await getQuizzes()

        expect(mockQuiz.findMany).toHaveBeenCalledWith({
            orderBy: { createdAt: 'desc' },
            include: {
                document: { select: { id: true, title: true } },
                questions: {
                    select: {
                        id: true,
                        questionType: true,
                        attempts: {
                            orderBy: { createdAt: 'desc' },
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
        expect(result).toEqual(quizzes)
    })
})

describe('getQuizzesByDocument', () => {
    it('should return quizzes for a specific document', async () => {
        const quizzes = [{ id: 'quiz-1', questions: [{ id: 'q-1' }] }]
        mockQuiz.findMany.mockResolvedValue(quizzes)

        const result = await getQuizzesByDocument('doc-1')

        expect(mockQuiz.findMany).toHaveBeenCalledWith({
            where: { documentId: 'doc-1' },
            orderBy: { createdAt: 'desc' },
            include: {
                questions: { select: { id: true } },
            },
        })
        expect(result).toEqual(quizzes)
    })
})

describe('recordAttempt', () => {
    it('should create a quiz attempt for a correct answer', async () => {
        const attempt = { id: 'att-1', questionId: 'q-1', selectedIndex: 0, isCorrect: true }
        mockQuizAttempt.create.mockResolvedValue(attempt)

        const result = await recordAttempt('q-1', 0, true)

        expect(mockQuizAttempt.create).toHaveBeenCalledWith({
            data: {
                questionId: 'q-1',
                selectedIndex: 0,
                isCorrect: true,
                explanation: undefined,
            },
        })
        expect(result).toEqual(attempt)
    })

    it('should create a quiz attempt with explanation for a wrong answer', async () => {
        const attempt = { id: 'att-2', questionId: 'q-1', selectedIndex: 2, isCorrect: false }
        mockQuizAttempt.create.mockResolvedValue(attempt)

        const result = await recordAttempt('q-1', 2, false, 'Because the correct answer is...')

        expect(mockQuizAttempt.create).toHaveBeenCalledWith({
            data: {
                questionId: 'q-1',
                selectedIndex: 2,
                isCorrect: false,
                explanation: 'Because the correct answer is...',
            },
        })
        expect(result).toEqual(attempt)
    })
})

describe('getQuizResults', () => {
    it('should return quiz with questions and latest attempts', async () => {
        const quiz = {
            id: 'quiz-1',
            title: 'Test',
            document: { id: 'doc-1', title: 'Doc' },
            questions: [
                {
                    id: 'q-1',
                    questionIndex: 0,
                    attempts: [{ selectedIndex: 0, isCorrect: true }],
                },
            ],
        }
        mockQuiz.findUnique.mockResolvedValue(quiz)

        const result = await getQuizResults('quiz-1')

        expect(mockQuiz.findUnique).toHaveBeenCalledWith({
            where: { id: 'quiz-1' },
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
        expect(result).toEqual(quiz)
    })
})
