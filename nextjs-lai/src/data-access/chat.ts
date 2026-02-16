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

// Full-text search across chat messages using PostgreSQL tsvector
export async function searchMessages(query: string) {
    if (!query.trim()) return []

    const results = await prisma.$queryRaw<
        {
            id: string
            sessionId: string
            role: string
            content: string
            createdAt: Date
            sessionTitle: string | null
            headline: string
        }[]
    >`
        SELECT
            m.id,
            m."sessionId",
            m.role,
            m.content,
            m."createdAt",
            s.title AS "sessionTitle",
            ts_headline('german', m.content, plainto_tsquery('german', ${query}),
                'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15') AS headline
        FROM "ChatMessage" m
        JOIN "ChatSession" s ON s.id = m."sessionId"
        WHERE to_tsvector('german', m.content) @@ plainto_tsquery('german', ${query})
        ORDER BY m."createdAt" DESC
        LIMIT 30
    `

    return results
}

// Toggle bookmark on a message
export async function toggleBookmark(messageId: string) {
    const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        select: { isBookmarked: true },
    })
    if (!message) throw new Error('Nachricht nicht gefunden.')

    return prisma.chatMessage.update({
        where: { id: messageId },
        data: { isBookmarked: !message.isBookmarked },
    })
}

// Get all bookmarked messages
export async function getBookmarkedMessages() {
    return prisma.chatMessage.findMany({
        where: { isBookmarked: true },
        include: {
            session: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
    })
}
