import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing server actions
vi.mock('@/src/lib/llm', () => ({
    getModel: vi.fn(() => 'mock-model'),
}))

vi.mock('@/src/data-access/documents', () => ({
    getDocumentWithChunks: vi.fn((id: string) => {
        if (id === 'doc-1') {
            return Promise.resolve({
                id: 'doc-1',
                title: 'Test Document',
                chunks: [
                    { id: 'chunk-1', content: 'First section of the document.', chunkIndex: 0 },
                    { id: 'chunk-2', content: 'Second section of the document.', chunkIndex: 1 },
                    { id: 'chunk-3', content: 'Third section of the document.', chunkIndex: 2 },
                ],
            })
        }
        return Promise.resolve(null)
    }),
}))

vi.mock('@/src/data-access/quiz', () => ({
    createQuiz: vi.fn(() => Promise.resolve({ id: 'quiz-1', title: 'Quiz: Test Document', documentId: 'doc-1' })),
    addQuestions: vi.fn(() => Promise.resolve({ count: 3 })),
    getQuizWithQuestions: vi.fn((id: string) => {
        if (id === 'quiz-1') {
            return Promise.resolve({
                id: 'quiz-1',
                title: 'Quiz: Test Document',
                createdAt: new Date().toISOString(),
                document: { id: 'doc-1', title: 'Test Document' },
                questions: [
                    {
                        id: 'q-1',
                        questionText: 'What is discussed in section 1?',
                        options: ['A', 'B', 'C', 'D'],
                        correctIndex: 0,
                        questionIndex: 0,
                        questionType: 'mc',
                    },
                ],
            })
        }
        return Promise.resolve(null)
    }),
    getQuizzes: vi.fn(() => Promise.resolve([
        {
            id: 'quiz-1',
            title: 'Quiz: Test',
            document: { id: 'doc-1', title: 'Test' },
            questions: [{ id: 'q-1' }],
        },
    ])),
    getQuizResults: vi.fn((id: string) => {
        if (id === 'quiz-1') {
            return Promise.resolve({
                id: 'quiz-1',
                title: 'Quiz: Test',
                attempts: [],
            })
        }
        return Promise.resolve(null)
    }),
    deleteQuiz: vi.fn(),
    recordAttempt: vi.fn(() => Promise.resolve({ id: 'att-1' })),
    upsertQuestionProgress: vi.fn(() => Promise.resolve()),
}))

const mockQuizQuestion = {
    findUnique: vi.fn(),
}

vi.mock('@/src/lib/prisma', () => ({
    prisma: {
        quizQuestion: mockQuizQuestion,
    },
}))

vi.mock('ai', () => ({
    Output: {
        object: vi.fn(() => 'mock-output-schema'),
    },
    generateText: vi.fn(() => Promise.resolve({
        output: {
            questions: [
                {
                    questionText: 'What is in the first section?',
                    options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
                    correctIndex: 0,
                    explanation: 'Because the first section states...',
                    sourceSnippet: 'First section of the document.',
                },
                {
                    questionText: 'What is in the second section?',
                    options: ['X', 'Y', 'Z', 'W'],
                    correctIndex: 1,
                    explanation: 'Because...',
                    sourceSnippet: 'Second section of the document.',
                },
            ],
        },
        text: 'Die gewählte Antwort ist falsch, weil...',
    })),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

beforeEach(() => {
    vi.clearAllMocks()
})

describe('getQuizzes server action', () => {
    it('should return all quizzes', async () => {
        const { getQuizzes } = await import('@/src/actions/quiz')

        const data = await getQuizzes()

        expect(data).toHaveLength(1)
        expect(data[0].id).toBe('quiz-1')
    })
})

describe('generateQuiz server action', () => {
    it('should throw when documentId is missing', async () => {
        const { generateQuiz } = await import('@/src/actions/quiz')

        await expect(generateQuiz('', 5, ['mc'])).rejects.toThrow('Lernmaterial-ID ist erforderlich.')
    })

    it('should throw when document does not exist', async () => {
        const { generateQuiz } = await import('@/src/actions/quiz')

        await expect(generateQuiz('nonexistent', 5, ['mc'])).rejects.toThrow('Lernmaterial nicht gefunden.')
    })

    it('should generate a quiz for a valid document', async () => {
        const { generateQuiz } = await import('@/src/actions/quiz')

        const result = await generateQuiz('doc-1', 2, ['mc'])

        expect(result.quizId).toBe('quiz-1')
    })
})

describe('getQuiz server action', () => {
    it('should return quiz without correctIndex (cheat protection)', async () => {
        const { getQuiz } = await import('@/src/actions/quiz')

        const data = await getQuiz('quiz-1')

        expect(data).not.toBeNull()
        expect(data!.id).toBe('quiz-1')
        expect(data!.questions).toHaveLength(1)
        // Cheat protection: correctIndex must NOT be in the response
        expect((data!.questions[0] as Record<string, unknown>).correctIndex).toBeUndefined()
        expect(data!.questions[0].questionText).toBeDefined()
        expect(data!.questions[0].options).toBeDefined()
    })

    it('should return null for non-existent quiz', async () => {
        const { getQuiz } = await import('@/src/actions/quiz')

        const data = await getQuiz('nonexistent')

        expect(data).toBeNull()
    })
})

describe('deleteQuiz server action', () => {
    it('should delete a quiz', async () => {
        const { deleteQuiz: dbDeleteQuiz } = await import('@/src/data-access/quiz')
        const { deleteQuiz } = await import('@/src/actions/quiz')

        await deleteQuiz('quiz-1')

        expect(dbDeleteQuiz).toHaveBeenCalledWith('quiz-1')
    })

    it('should throw for non-existent quiz', async () => {
        const { deleteQuiz } = await import('@/src/actions/quiz')

        await expect(deleteQuiz('nonexistent')).rejects.toThrow('Quiz nicht gefunden.')
    })
})

describe('evaluateAnswer server action', () => {
    it('should throw when questionId is missing', async () => {
        const { evaluateAnswer } = await import('@/src/actions/quiz')

        await expect(evaluateAnswer('', 0)).rejects.toThrow('Frage-ID ist erforderlich.')
    })

    it('should return correct result for a right answer', async () => {
        mockQuizQuestion.findUnique.mockResolvedValue({
            id: 'q-1',
            questionText: 'Test question?',
            options: ['A', 'B', 'C', 'D'],
            correctIndex: 0,
            correctAnswer: null,
            explanation: 'A is correct because...',
            sourceSnippet: 'Source text',
            questionType: 'mc',
        })

        const { evaluateAnswer } = await import('@/src/actions/quiz')
        const result = await evaluateAnswer('q-1', 0)

        expect(result.isCorrect).toBe(true)
        expect(result.correctIndex).toBe(0)
    })

    it('should return explanation for a wrong answer via LLM', async () => {
        mockQuizQuestion.findUnique.mockResolvedValue({
            id: 'q-1',
            questionText: 'Test question?',
            options: ['A', 'B', 'C', 'D'],
            correctIndex: 0,
            correctAnswer: null,
            explanation: 'A is correct because...',
            sourceSnippet: 'Source text',
            questionType: 'mc',
        })

        const { evaluateAnswer } = await import('@/src/actions/quiz')
        const result = await evaluateAnswer('q-1', 2)

        expect(result.isCorrect).toBe(false)
        expect(result.correctIndex).toBe(0)
        expect(result.explanation).toBe('Die gewählte Antwort ist falsch, weil...')
    })

    it('should throw for non-existent question', async () => {
        mockQuizQuestion.findUnique.mockResolvedValue(null)

        const { evaluateAnswer } = await import('@/src/actions/quiz')

        await expect(evaluateAnswer('nonexistent', 0)).rejects.toThrow('Frage nicht gefunden.')
    })
})

describe('getQuizResults server action', () => {
    it('should return quiz results', async () => {
        const { getQuizResults } = await import('@/src/actions/quiz')

        const data = await getQuizResults('quiz-1')

        expect(data).not.toBeNull()
        expect(data!.id).toBe('quiz-1')
    })

    it('should return null for non-existent quiz', async () => {
        const { getQuizResults } = await import('@/src/actions/quiz')

        const data = await getQuizResults('nonexistent')

        expect(data).toBeNull()
    })
})
