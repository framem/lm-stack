'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getRandomChunks } from '@/src/data-access/documents'
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

// Generate contextual chat suggestions from random document chunks
const suggestionsSchema = z.object({
    questions: z.array(z.string()).describe('Exactly 4 entry questions based on the learning material'),
})

export async function getChatSuggestions(documentIds?: string[]): Promise<string[]> {
    const chunks = await getRandomChunks(4, documentIds)
    if (chunks.length === 0) return []

    const context = chunks
        .map((c, i) => `[${i + 1}] (${c.documentTitle}):\n${c.content.slice(0, 500)}`)
        .join('\n\n')

    const { output } = await generateText({
        model: getModel(),
        temperature: 0.7,
        maxOutputTokens: 300,
        output: Output.object({ schema: suggestionsSchema }),
        system: `Du generierst Einstiegsfragen für einen Lernassistenten. Die Fragen sollen:
- Konkret auf das Lernmaterial bezogen sein
- Verschiedene Aspekte und Dokumente abdecken
- Kurz und prägnant formuliert sein (max. 10 Wörter)
- Auf Deutsch formuliert sein`,
        prompt: `Generiere genau 4 verschiedene Fragen basierend auf diesem Lernmaterial:\n\n${context}`,
    })

    return output?.questions?.slice(0, 4) ?? []
}
