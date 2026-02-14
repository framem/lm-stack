'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useChat } from '@ai-sdk/react'
import { z } from 'zod'
import { Send, Loader2, BookOpen, FileText, X } from 'lucide-react'
import { ChatMessageBubble } from '@/src/components/ChatMessageBubble'

interface ChatInterfaceProps {
    sessionId?: string
    documentId?: string
}

interface StoredSource {
    index: number
    documentId: string
    documentTitle: string
    pageNumber: number | null
    chunkId: string
    snippet: string
    content: string
}

const messageMetadataSchema = z.object({
    sources: z.array(z.object({
        index: z.number(),
        documentId: z.string(),
        documentTitle: z.string(),
        pageNumber: z.number().nullable(),
        chunkId: z.string(),
        snippet: z.string(),
        content: z.string(),
    })).optional(),
})

type ChatMessage = UIMessage<z.infer<typeof messageMetadataSchema>>

function getTextContent(message: ChatMessage): string {
    return message.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('')
}

// Full chat interface with message list, input, and source detail panel
export function ChatInterface({ sessionId, documentId }: ChatInterfaceProps) {
    const [activeSessionId, setActiveSessionId] = useState(sessionId)
    const [activeSource, setActiveSource] = useState<StoredSource | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const [input, setInput] = useState('')
    const activeSessionIdRef = useRef(activeSessionId)

    useEffect(() => {
        activeSessionIdRef.current = activeSessionId
    }, [activeSessionId])

    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({ sessionId: activeSessionIdRef.current, documentId }),
        fetch: async (url, init) => {
            const response = await globalThis.fetch(url as string, init as RequestInit)
            const newSessionId = response.headers.get('X-Session-Id')
            if (newSessionId && !activeSessionIdRef.current) {
                setActiveSessionId(newSessionId)
            }
            return response
        },
    }), [documentId])

    const { messages, sendMessage, status } = useChat<ChatMessage>({ transport, messageMetadataSchema })

    const isLoading = status === 'streaming' || status === 'submitted'

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = input.trim()
        if (!trimmed || isLoading) return
        sendMessage({ text: trimmed })
        setInput('')
    }

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Toggle a source in the detail panel
    function handleSourceClick(source: StoredSource) {
        setActiveSource((prev) => prev?.chunkId === source.chunkId ? null : source)
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-0">
            {/* Main chat area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-lg font-semibold mb-2">Lernassistent</h2>
                            <p className="text-muted-foreground text-sm max-w-md">
                                Stelle eine Frage zu deinen Dokumenten. Der Assistent antwortet basierend auf den hochgeladenen Inhalten und zitiert die Quellen.
                            </p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <ChatMessageBubble
                            key={message.id}
                            role={message.role as 'user' | 'assistant'}
                            content={getTextContent(message)}
                            sources={message.metadata?.sources}
                            activeSourceChunkId={activeSource?.chunkId}
                            onSourceClick={handleSourceClick}
                        />
                    ))}

                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                            <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3">
                                <p className="text-sm text-muted-foreground">Denke nach...</p>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t border-border p-4">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Stelle eine Frage..."
                            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="rounded-lg bg-primary text-primary-foreground px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Source detail panel (right side) */}
            <div className="w-96 border-l border-border bg-card/50 overflow-y-auto hidden lg:block">
                <div className="p-4">
                    {activeSource ? (
                        <>
                            <div className="flex items-start justify-between gap-2 mb-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                        {activeSource.index}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                            <span className="text-sm font-medium truncate">{activeSource.documentTitle}</span>
                                        </div>
                                        {activeSource.pageNumber != null && (
                                            <p className="text-xs text-muted-foreground mt-0.5">Seite {activeSource.pageNumber}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveSource(null)}
                                    className="flex-shrink-0 p-1 rounded hover:bg-accent transition-colors text-muted-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="rounded-lg border border-border bg-background p-4">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeSource.content}</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground">
                                Klicke auf eine Quelle, um den vollständigen Textabschnitt zu sehen.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
