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

describe('getSessions server action', () => {
    it('should return all sessions', async () => {
        const { getSessions } = await import('@/src/actions/chat')

        const data = await getSessions()

        expect(data).toHaveLength(1)
        expect(data[0].id).toBe('sess-1')
    })
})

describe('createSession server action', () => {
    it('should create a new session', async () => {
        const { createSession } = await import('@/src/actions/chat')

        const data = await createSession({ title: 'New Session' })

        expect(data.id).toBe('sess-new')
    })
})

describe('getSession server action', () => {
    it('should return a session with messages', async () => {
        const { getSession } = await import('@/src/actions/chat')

        const data = await getSession('sess-1')

        expect(data).not.toBeNull()
        expect(data!.id).toBe('sess-1')
        expect(data!.messages).toHaveLength(2)
    })

    it('should return null for non-existent session', async () => {
        const { getSession } = await import('@/src/actions/chat')

        const data = await getSession('nonexistent')

        expect(data).toBeNull()
    })
})

describe('deleteSession server action', () => {
    it('should delete a session', async () => {
        const { deleteSession: dbDeleteSession } = await import('@/src/data-access/chat')
        const { deleteSession } = await import('@/src/actions/chat')

        await deleteSession('sess-1')

        expect(dbDeleteSession).toHaveBeenCalledWith('sess-1')
    })
})
