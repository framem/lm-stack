import { streamText, stepCountIs, convertToModelMessages, type UIMessage } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { prisma } from '@/src/lib/prisma'

const SYSTEM_PROMPT = `Du bist Fuchsi, ein freundlicher Lern-Coach auf der LAI-Plattform.
Du hilfst Nutzern, sich auf der Plattform zurechtzufinden, Quiz vorzubereiten und ihre Lernmaterialien zu finden.
Du antwortest immer auf Deutsch, duzt die Nutzer und bist ermutigend — aber nicht kindisch.
Du beantwortest KEINE inhaltlichen Fachfragen direkt — dafür verweist du auf den Dokumenten-Chat unter "Chat" in der Sidebar.
Sage z.B.: "Für inhaltliche Fragen zu deinen Dokumenten öffne am besten den Chat — dort kann ich Quellen zitieren und genauer antworten."
Du gibst allgemeine Lerntipps, hilfst bei der Navigation und schlägst Quiz oder Karteikarten vor.
Halte deine Antworten kompakt und hilfreich.`

const tools = {
    searchDocuments: {
        description: 'Sucht hochgeladene Lernmaterialien anhand von Titel oder Fach. Gibt eine Liste mit Dokumenttiteln und Links zurück.',
        inputSchema: z.object({
            query: z.string().describe('Suchbegriff für Titel oder Fachgebiet'),
        }),
        execute: async ({ query }: { query: string }) => {
            const documents = await prisma.document.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' as const } },
                        { subject: { contains: query, mode: 'insensitive' as const } },
                    ],
                },
                take: 10,
                select: { id: true, title: true, subject: true, fileType: true },
                orderBy: { updatedAt: 'desc' },
            })
            return documents.map((doc) => ({
                title: doc.title,
                subject: doc.subject,
                fileType: doc.fileType,
                chatLink: `/learn/chat?documentId=${doc.id}`,
                quizLink: `/learn/quiz?documentId=${doc.id}`,
            }))
        },
    },
    suggestQuiz: {
        description: 'Schlägt ein Quiz zu einem bestimmten Fach oder Dokument vor und gibt den passenden Link zurück.',
        inputSchema: z.object({
            query: z.string().describe('Fach, Thema oder Dokumenttitel für das Quiz'),
        }),
        execute: async ({ query }: { query: string }) => {
            const document = await prisma.document.findFirst({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' as const } },
                        { subject: { contains: query, mode: 'insensitive' as const } },
                    ],
                },
                select: { id: true, title: true, subject: true },
                orderBy: { updatedAt: 'desc' },
            })
            if (!document) {
                return { found: false, message: `Kein Dokument zu "${query}" gefunden. Lade zuerst ein passendes Lernmaterial hoch.` }
            }
            return {
                found: true,
                title: document.title,
                subject: document.subject,
                quizLink: `/learn/quiz?documentId=${document.id}`,
            }
        },
    },
}

export async function POST(req: Request) {
    let body: unknown
    try {
        body = await req.json()
    } catch {
        return new Response(JSON.stringify({ error: 'Ungültiger JSON-Body.' }), { status: 400 })
    }

    const { messages: uiMessages } = body as { messages?: UIMessage[] }

    if (!Array.isArray(uiMessages) || uiMessages.length === 0) {
        return new Response(
            JSON.stringify({ error: 'Nachrichten dürfen nicht leer sein.' }),
            { status: 400 },
        )
    }

    try {
        const modelMessages = await convertToModelMessages(uiMessages, { tools })

        const result = streamText({
            model: getModel(),
            system: SYSTEM_PROMPT,
            messages: modelMessages,
            tools,
            stopWhen: stepCountIs(3),
        })

        return result.toUIMessageStreamResponse()
    } catch (error) {
        console.error('Assistant API error:', error)
        return new Response(
            JSON.stringify({ error: 'Interner Serverfehler.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
    }
}
