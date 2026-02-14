import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing routes
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
    recordAttempt: vi.fn(() => Promise.resolve({ id: 'att-1' })),
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

beforeEach(() => {
    vi.clearAllMocks()
})

describe('GET /api/quiz', () => {
    it('should return all quizzes', async () => {
        const { GET } = await import('@/src/app/api/quiz/route')

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveLength(1)
        expect(data[0].id).toBe('quiz-1')
    })
})

describe('POST /api/quiz/generate', () => {
    it('should return 400 when documentId is missing', async () => {
        const { POST } = await import('@/src/app/api/quiz/generate/route')
        const request = new Request('http://localhost/api/quiz/generate', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBeDefined()
    })

    it('should return 404 when document does not exist', async () => {
        const { POST } = await import('@/src/app/api/quiz/generate/route')
        const request = new Request('http://localhost/api/quiz/generate', {
            method: 'POST',
            body: JSON.stringify({ documentId: 'nonexistent' }),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)

        expect(response.status).toBe(404)
    })

    it('should generate a quiz for a valid document', async () => {
        const { POST } = await import('@/src/app/api/quiz/generate/route')
        const request = new Request('http://localhost/api/quiz/generate', {
            method: 'POST',
            body: JSON.stringify({ documentId: 'doc-1', questionCount: 2 }),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.quizId).toBe('quiz-1')
    })
})

describe('GET /api/quiz/[id]', () => {
    it('should return quiz without correctIndex (cheat protection)', async () => {
        const { GET } = await import('@/src/app/api/quiz/[id]/route')
        const request = new Request('http://localhost/api/quiz/quiz-1')

        const response = await GET(request as any, {
            params: Promise.resolve({ id: 'quiz-1' }),
        })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.id).toBe('quiz-1')
        expect(data.questions).toHaveLength(1)
        // Cheat protection: correctIndex must NOT be in the response
        expect(data.questions[0].correctIndex).toBeUndefined()
        expect(data.questions[0].questionText).toBeDefined()
        expect(data.questions[0].options).toBeDefined()
    })

    it('should return 404 for non-existent quiz', async () => {
        const { GET } = await import('@/src/app/api/quiz/[id]/route')
        const request = new Request('http://localhost/api/quiz/nonexistent')

        const response = await GET(request as any, {
            params: Promise.resolve({ id: 'nonexistent' }),
        })

        expect(response.status).toBe(404)
    })
})

describe('POST /api/quiz/evaluate', () => {
    it('should return 400 when questionId is missing', async () => {
        const { POST } = await import('@/src/app/api/quiz/evaluate/route')
        const request = new Request('http://localhost/api/quiz/evaluate', {
            method: 'POST',
            body: JSON.stringify({ selectedIndex: 0 }),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)

        expect(response.status).toBe(400)
    })

    it('should return correct result for a right answer', async () => {
        mockQuizQuestion.findUnique.mockResolvedValue({
            id: 'q-1',
            questionText: 'Test question?',
            options: ['A', 'B', 'C', 'D'],
            correctIndex: 0,
            explanation: 'A is correct because...',
            sourceSnippet: 'Source text',
        })

        const { POST } = await import('@/src/app/api/quiz/evaluate/route')
        const request = new Request('http://localhost/api/quiz/evaluate', {
            method: 'POST',
            body: JSON.stringify({ questionId: 'q-1', selectedIndex: 0 }),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.isCorrect).toBe(true)
        expect(data.correctIndex).toBe(0)
    })

    it('should return explanation for a wrong answer via LLM', async () => {
        mockQuizQuestion.findUnique.mockResolvedValue({
            id: 'q-1',
            questionText: 'Test question?',
            options: ['A', 'B', 'C', 'D'],
            correctIndex: 0,
            explanation: 'A is correct because...',
            sourceSnippet: 'Source text',
        })

        const { POST } = await import('@/src/app/api/quiz/evaluate/route')
        const request = new Request('http://localhost/api/quiz/evaluate', {
            method: 'POST',
            body: JSON.stringify({ questionId: 'q-1', selectedIndex: 2 }),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.isCorrect).toBe(false)
        expect(data.correctIndex).toBe(0)
        expect(data.explanation).toBe('Die gewählte Antwort ist falsch, weil...')
    })

    it('should return 404 for non-existent question', async () => {
        mockQuizQuestion.findUnique.mockResolvedValue(null)

        const { POST } = await import('@/src/app/api/quiz/evaluate/route')
        const request = new Request('http://localhost/api/quiz/evaluate', {
            method: 'POST',
            body: JSON.stringify({ questionId: 'nonexistent', selectedIndex: 0 }),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)

        expect(response.status).toBe(404)
    })
})
