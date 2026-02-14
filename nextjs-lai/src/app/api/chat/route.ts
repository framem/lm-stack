import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { getModel } from '@/src/lib/llm'
import { retrieveContext, buildContextPrompt, extractCitations } from '@/src/lib/rag'
import { formatCitationsForStorage } from '@/src/lib/citations'
import { addMessage, createSession } from '@/src/data-access/chat'

const SYSTEM_PROMPT_TEMPLATE = `Du bist ein KI-Lernassistent. Beantworte Fragen NUR basierend auf dem folgenden Kontext.
Zitiere deine Quellen mit [Quelle N] im Text.
Wenn der Kontext keine relevante Information enthält, sage dies ehrlich.

Kontext:
{context}`

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { messages, sessionId, documentIds } = body as {
            messages: UIMessage[]
            sessionId?: string
            documentIds?: string[]
        }

        if (!messages || messages.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Keine Nachrichten vorhanden.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const lastMessage = messages[messages.length - 1]
        if (lastMessage.role !== 'user') {
            return new Response(
                JSON.stringify({ error: 'Letzte Nachricht muss vom Benutzer sein.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const userQuery = lastMessage.parts
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('')

        // Retrieve relevant context via RAG pipeline
        const contexts = await retrieveContext(userQuery, {
            topK: 5,
            documentIds: documentIds && documentIds.length > 0 ? documentIds : undefined,
        })

        const contextPrompt = buildContextPrompt(contexts)
        const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{context}', contextPrompt)

        // Ensure a session exists for message persistence
        let activeSessionId = sessionId
        if (!activeSessionId) {
            const session = await createSession({
                title: userQuery.slice(0, 100),
                documentId: documentIds?.length === 1 ? documentIds[0] : undefined,
            })
            activeSessionId = session.id
        }

        // Persist the user message
        await addMessage({
            sessionId: activeSessionId,
            role: 'user',
            content: userQuery,
        })

        // Stream the LLM response
        const result = streamText({
            model: getModel(),
            system: systemPrompt,
            messages: await convertToModelMessages(messages),
        })

        // Accumulate text to extract citations at the end
        let accumulatedText = ''

        return result.toUIMessageStreamResponse({
            sendReasoning: true,
            headers: {
                'X-Session-Id': activeSessionId,
            },
            messageMetadata: ({ part }) => {
                if (part.type === 'text-delta') {
                    accumulatedText += part.text
                }
                if (part.type === 'finish') {
                    // Strip <think> blocks for citation extraction (providers that pass reasoning as text)
                    const textForCitations = accumulatedText.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
                    const citations = extractCitations(textForCitations, contexts)
                    const sources = formatCitationsForStorage(citations)

                    // Persist the assistant message (fire-and-forget)
                    addMessage({
                        sessionId: activeSessionId!,
                        role: 'assistant',
                        content: accumulatedText,
                        sources: sources.length > 0 ? sources : undefined,
                    })

                    return { sources }
                }
                return undefined
            },
        })
    } catch (error) {
        console.error('Chat API error:', error)
        return new Response(
            JSON.stringify({ error: 'Interner Serverfehler beim Verarbeiten der Nachricht.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
