import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing routes
vi.mock('@/src/lib/llm', () => ({
    getModel: vi.fn(() => 'mock-model'),
    createEmbedding: vi.fn(() => Promise.resolve(new Array(768).fill(0))),
}))

vi.mock('@/src/data-access/documents', () => ({
    findSimilarChunks: vi.fn(() => Promise.resolve([
        {
            id: 'chunk-1',
            content: 'Machine learning is a subset of AI.',
            documentId: 'doc-1',
            documentTitle: 'AI Basics',
            pageNumber: 3,
            chunkIndex: 0,
            similarity: 0.92,
        },
        {
            id: 'chunk-2',
            content: 'Neural networks consist of layers.',
            documentId: 'doc-1',
            documentTitle: 'AI Basics',
            pageNumber: 7,
            chunkIndex: 2,
            similarity: 0.85,
        },
    ])),
}))

vi.mock('@/src/data-access/chat', () => ({
    createSession: vi.fn(() => Promise.resolve({ id: 'sess-new' })),
    addMessage: vi.fn(() => Promise.resolve({ id: 'msg-1' })),
    getSessions: vi.fn(() => Promise.resolve([
        { id: 'sess-1', title: 'Test Session', _count: { messages: 3 } },
    ])),
    getSessionWithMessages: vi.fn((id: string) => {
        if (id === 'sess-1') {
            return Promise.resolve({
                id: 'sess-1',
                title: 'Test Session',
                messages: [
                    { id: 'msg-1', role: 'user', content: 'What is AI?' },
                    { id: 'msg-2', role: 'assistant', content: 'AI is...' },
                ],
            })
        }
        return Promise.resolve(null)
    }),
    deleteSession: vi.fn(),
}))

const mockStreamTextResult = {
    toUIMessageStreamResponse: vi.fn(() => new Response('streamed', {
        headers: { 'Content-Type': 'text/plain' },
    })),
}

vi.mock('ai', () => ({
    streamText: vi.fn(() => mockStreamTextResult),
}))

beforeEach(() => {
    vi.clearAllMocks()
})

describe('POST /api/chat', () => {
    it('should return 400 when messages are empty', async () => {
        const { POST } = await import('@/src/app/api/chat/route')
        const request = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [] }),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)

        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toBeDefined()
    })

    it('should return 400 when last message is not from user', async () => {
        const { POST } = await import('@/src/app/api/chat/route')
        const request = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                messages: [{ id: '1', role: 'assistant', content: 'Hello' }],
            }),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)

        expect(response.status).toBe(400)
    })

    it('should stream a response for a valid question', async () => {
        const { POST } = await import('@/src/app/api/chat/route')
        const request = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                messages: [{ id: '1', role: 'user', content: 'What is machine learning?' }],
            }),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)

        expect(response).toBeDefined()
        expect(mockStreamTextResult.toUIMessageStreamResponse).toHaveBeenCalled()
    })
})

describe('GET /api/chat/sessions', () => {
    it('should return all sessions', async () => {
        const { GET } = await import('@/src/app/api/chat/sessions/route')

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveLength(1)
        expect(data[0].id).toBe('sess-1')
    })
})

describe('POST /api/chat/sessions', () => {
    it('should create a new session', async () => {
        const { POST } = await import('@/src/app/api/chat/sessions/route')
        const request = new Request('http://localhost/api/chat/sessions', {
            method: 'POST',
            body: JSON.stringify({ title: 'New Session' }),
            headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request as any)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.id).toBe('sess-new')
    })
})

describe('GET /api/chat/sessions/[id]', () => {
    it('should return a session with messages', async () => {
        const { GET } = await import('@/src/app/api/chat/sessions/[id]/route')
        const request = new Request('http://localhost/api/chat/sessions/sess-1')

        const response = await GET(request, { params: Promise.resolve({ id: 'sess-1' }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.id).toBe('sess-1')
        expect(data.messages).toHaveLength(2)
    })

    it('should return 404 for non-existent session', async () => {
        const { GET } = await import('@/src/app/api/chat/sessions/[id]/route')
        const request = new Request('http://localhost/api/chat/sessions/nonexistent')

        const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })

        expect(response.status).toBe(404)
    })
})
