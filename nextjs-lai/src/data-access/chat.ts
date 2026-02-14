import { prisma } from '@/src/lib/prisma'

// Create a new chat session, optionally scoped to a document
export async function createSession(opts: { title?: string; documentId?: string } = {}) {
    return prisma.chatSession.create({
        data: {
            title: opts.title ?? null,
            documentId: opts.documentId ?? null,
        },
    })
}

// List all chat sessions, ordered by most recent first
export async function getSessions() {
    return prisma.chatSession.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            document: { select: { id: true, title: true } },
            _count: { select: { messages: true } },
        },
    })
}

// Get a single session with all its messages
export async function getSessionWithMessages(id: string) {
    return prisma.chatSession.findUnique({
        where: { id },
        include: {
            document: { select: { id: true, title: true } },
            messages: {
                orderBy: { createdAt: 'asc' },
            },
        },
    })
}

// Append a message to a chat session
export async function addMessage(opts: {
    sessionId: string
    role: string
    content: string
    sources?: object[]
}) {
    return prisma.chatMessage.create({
        data: {
            sessionId: opts.sessionId,
            role: opts.role,
            content: opts.content,
            sources: opts.sources ?? undefined,
        },
    })
}

// Delete a chat session and all its messages (cascades)
export async function deleteSession(id: string) {
    return prisma.chatSession.delete({
        where: { id },
    })
}
