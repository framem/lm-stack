import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockChatSession, mockChatMessage } = vi.hoisted(() => ({
    mockChatSession: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
    },
    mockChatMessage: {
        create: vi.fn(),
    },
}))

vi.mock('@/src/lib/prisma', () => ({
    prisma: {
        chatSession: mockChatSession,
        chatMessage: mockChatMessage,
    },
}))

import { createSession, getSessions, getSessionWithMessages, addMessage, deleteSession } from '@/src/data-access/chat'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('createSession', () => {
    it('should create a session with default values', async () => {
        const session = { id: 'sess-1', title: null, documentId: null, mode: 'learning', scenario: null }
        mockChatSession.create.mockResolvedValue(session)

        const result = await createSession()

        expect(mockChatSession.create).toHaveBeenCalledWith({
            data: { title: null, documentId: null, mode: 'learning', scenario: null },
        })
        expect(result).toEqual(session)
    })

    it('should create a session with title and documentId', async () => {
        const session = { id: 'sess-2', title: 'Test', documentId: 'doc-1', mode: 'learning', scenario: null }
        mockChatSession.create.mockResolvedValue(session)

        const result = await createSession({ title: 'Test', documentId: 'doc-1' })

        expect(mockChatSession.create).toHaveBeenCalledWith({
            data: { title: 'Test', documentId: 'doc-1', mode: 'learning', scenario: null },
        })
        expect(result).toEqual(session)
    })
})

describe('getSessions', () => {
    it('should return sessions ordered by updatedAt desc', async () => {
        const sessions = [
            { id: 'sess-2', title: 'Recent', updatedAt: new Date() },
            { id: 'sess-1', title: 'Older', updatedAt: new Date() },
        ]
        mockChatSession.findMany.mockResolvedValue(sessions)

        const result = await getSessions()

        expect(mockChatSession.findMany).toHaveBeenCalledWith({
            orderBy: { updatedAt: 'desc' },
            include: {
                document: { select: { id: true, title: true } },
                _count: { select: { messages: true } },
            },
        })
        expect(result).toEqual(sessions)
    })
})

describe('getSessionWithMessages', () => {
    it('should return a session with messages', async () => {
        const session = {
            id: 'sess-1',
            messages: [{ id: 'msg-1', content: 'Hello' }],
        }
        mockChatSession.findUnique.mockResolvedValue(session)

        const result = await getSessionWithMessages('sess-1')

        expect(mockChatSession.findUnique).toHaveBeenCalledWith({
            where: { id: 'sess-1' },
            include: {
                document: { select: { id: true, title: true } },
                messages: { orderBy: { createdAt: 'asc' } },
            },
        })
        expect(result).toEqual(session)
    })

    it('should return null for non-existent session', async () => {
        mockChatSession.findUnique.mockResolvedValue(null)

        const result = await getSessionWithMessages('nonexistent')

        expect(result).toBeNull()
    })
})

describe('addMessage', () => {
    it('should create a message with sources', async () => {
        const msg = { id: 'msg-1', sessionId: 'sess-1', role: 'assistant', content: 'Answer' }
        mockChatMessage.create.mockResolvedValue(msg)

        const sources = [{ index: 1, documentTitle: 'Doc', snippet: '...' }]
        const result = await addMessage({
            sessionId: 'sess-1',
            role: 'assistant',
            content: 'Answer',
            sources,
        })

        expect(mockChatMessage.create).toHaveBeenCalledWith({
            data: {
                sessionId: 'sess-1',
                role: 'assistant',
                content: 'Answer',
                sources,
            },
        })
        expect(result).toEqual(msg)
    })

    it('should create a message without sources', async () => {
        const msg = { id: 'msg-2', sessionId: 'sess-1', role: 'user', content: 'Question' }
        mockChatMessage.create.mockResolvedValue(msg)

        await addMessage({
            sessionId: 'sess-1',
            role: 'user',
            content: 'Question',
        })

        expect(mockChatMessage.create).toHaveBeenCalledWith({
            data: {
                sessionId: 'sess-1',
                role: 'user',
                content: 'Question',
                sources: undefined,
            },
        })
    })
})

describe('deleteSession', () => {
    it('should delete a session by id', async () => {
        mockChatSession.delete.mockResolvedValue({ id: 'sess-1' })

        await deleteSession('sess-1')

        expect(mockChatSession.delete).toHaveBeenCalledWith({
            where: { id: 'sess-1' },
        })
    })
})
