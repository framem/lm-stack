'use server'

import {
    getSessions as dbGetSessions,
    getSessionWithMessages as dbGetSessionWithMessages,
    createSession as dbCreateSession,
    deleteSession as dbDeleteSession,
} from '@/src/data-access/chat'

// List all chat sessions
export async function getSessions() {
    return dbGetSessions()
}

// Get a single session with all its messages, returns null if not found
export async function getSession(id: string) {
    return dbGetSessionWithMessages(id)
}

// Create a new chat session
export async function createSession(opts: { title?: string; documentId?: string } = {}) {
    return dbCreateSession(opts)
}

// Delete a chat session and all its messages
export async function deleteSession(id: string) {
    await dbDeleteSession(id)
}
