import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { getModel } from '@/src/lib/llm'
import { retrieveContext, buildContextPrompt, extractCitations } from '@/src/lib/rag'
import { formatCitationsForStorage } from '@/src/lib/citations'
import { addMessage, createSession } from '@/src/data-access/chat'
import { getScenario } from '@/src/lib/conversation-scenarios'

const SYSTEM_PROMPT_TEMPLATE = `Du bist ein KI-Lernassistent. Beantworte Fragen NUR basierend auf dem folgenden Kontext.
Zitiere deine Quellen IMMER exakt im Format [Quelle N] mit eckigen Klammern, z.B. [Quelle 1], [Quelle 3].
Regeln für Quellenangaben:
- IMMER eckige Klammern verwenden: [Quelle 1], NICHT Quelle 1.
- Jede Quelle einzeln angeben: [Quelle 2] [Quelle 3] [Quelle 4], NICHT [Quelle 2–4] oder Quelle 2–Quelle 4.
- Keine Bereiche, keine Aufzählungen ohne Klammern.
Wenn der Kontext keine relevante Information enthält, sage dies ehrlich.

Kontext:
{context}`

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { messages, sessionId, documentIds, mode, scenario, scenarioLanguage } = body as {
            messages: UIMessage[]
            sessionId?: string
            documentIds?: string[]
            mode?: string
            scenario?: string
            scenarioLanguage?: 'de' | 'en' | 'es'
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

        const isConversation = mode === 'conversation'
        let systemPrompt: string
        let contexts: Awaited<ReturnType<typeof retrieveContext>> = []

        if (isConversation && scenario) {
            // Conversation mode: use scenario system prompt, skip RAG
            const scenarioDef = getScenario(scenario)
            if (!scenarioDef) {
                return new Response(
                    JSON.stringify({ error: 'Unbekanntes Szenario.' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                )
            }
            const lang = scenarioLanguage || 'de'
            systemPrompt = scenarioDef.translations[lang].systemPrompt
        } else {
            // Learning mode: RAG pipeline
            contexts = await retrieveContext(userQuery, {
                topK: 5,
                documentIds: documentIds && documentIds.length > 0 ? documentIds : undefined,
            })
            const contextPrompt = buildContextPrompt(contexts)
            systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{context}', contextPrompt)
        }

        // Ensure a session exists for message persistence
        let activeSessionId = sessionId
        if (!activeSessionId) {
            const session = await createSession({
                title: userQuery.slice(0, 100),
                documentId: !isConversation && documentIds?.length === 1 ? documentIds[0] : undefined,
                mode: isConversation ? 'conversation' : 'learning',
                scenario: isConversation ? scenario : undefined,
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

        if (isConversation) {
            // Conversation mode: no citations, simpler streaming
            let accumulatedText = ''

            return result.toUIMessageStreamResponse({
                sendReasoning: true,
                headers: { 'X-Session-Id': activeSessionId },
                messageMetadata: ({ part }) => {
                    if (part.type === 'text-delta') {
                        accumulatedText += part.text
                    }
                    if (part.type === 'finish') {
                        addMessage({
                            sessionId: activeSessionId!,
                            role: 'assistant',
                            content: accumulatedText,
                        })
                    }
                    return undefined
                },
            })
        }

        // Learning mode: citation extraction
        let accumulatedText = ''
        let lastSourceCount = 0
        const noContext = contexts.length === 0

        return result.toUIMessageStreamResponse({
            sendReasoning: true,
            headers: {
                'X-Session-Id': activeSessionId,
            },
            messageMetadata: ({ part }) => {
                // Signal empty context on first text chunk
                if (noContext && part.type === 'text-delta' && accumulatedText === '') {
                    accumulatedText += part.text
                    return { sources: [], noContext: true }
                }
                if (part.type === 'text-delta') {
                    accumulatedText += part.text
                    // Strip completed and unclosed <think> blocks before scanning
                    let textForCitations = accumulatedText.replace(/<think>[\s\S]*?<\/think>/g, '')
                    const lastOpen = textForCitations.lastIndexOf('<think>')
                    const lastClose = textForCitations.lastIndexOf('</think>')
                    if (lastOpen > lastClose) {
                        textForCitations = textForCitations.slice(0, lastOpen)
                    }
                    const citations = extractCitations(textForCitations.trim(), contexts)
                    if (citations.length > lastSourceCount) {
                        lastSourceCount = citations.length
                        return { sources: formatCitationsForStorage(citations) }
                    }
                }
                if (part.type === 'finish') {
                    // Final extraction for DB persistence
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
