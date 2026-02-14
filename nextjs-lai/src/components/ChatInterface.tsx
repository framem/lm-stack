'use client'

import { Fragment, useState, useMemo, useEffect, useRef } from 'react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useChat } from '@ai-sdk/react'
import { z } from 'zod'
import { BookOpen, FileText, X, Loader2, ChevronDown, CornerDownLeft } from 'lucide-react'
import { getSession } from '@/src/actions/chat'

import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
} from '@/src/components/ai-elements/conversation'
import {
    Message,
    MessageContent,
    MessageResponse,
} from '@/src/components/ai-elements/message'
import {
    PromptInput,
    PromptInputBody,
    PromptInputFooter,
    PromptInputTools,
    PromptInputButton,
    PromptInputTextarea,
    PromptInputSubmit,
    type PromptInputMessage,
} from '@/src/components/ai-elements/prompt-input'
import {
    Sources,
    SourcesTrigger,
    SourcesContent,
} from '@/src/components/ai-elements/sources'
import { Shimmer } from '@/src/components/ai-elements/shimmer'

interface ChatInterfaceProps {
    sessionId?: string
    documentId?: string
    onSessionCreated?: (sessionId: string, title: string) => void
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

// Shape returned by the session API for stored messages
interface StoredMessage {
    id: string
    role: string
    content: string
    sources: StoredSource[] | null
    createdAt: string
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

// Turn [Quelle N] references in assistant text into clickable markdown links
function linkifyCitations(text: string): string {
    return text.replace(/\[Quelle\s+(\d+)\](?!\()/g, '[Quelle $1](#cite-$1)')
}

// Transform a filename-derived title into a readable display title
function prettifyTitle(raw: string): string {
    return raw
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

// Convert stored DB messages to UIMessage format for useChat initialMessages
function storedToUIMessages(stored: StoredMessage[]): ChatMessage[] {
    return stored.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: msg.content }],
        metadata: msg.sources ? { sources: msg.sources } : undefined,
    }))
}

// Full chat interface with message list, input, and source detail panel
export function ChatInterface({ sessionId, documentId, onSessionCreated }: ChatInterfaceProps) {
    const [activeSessionId, setActiveSessionId] = useState(sessionId)
    const [activeSource, setActiveSource] = useState<StoredSource | null>(null)
    const [loadingSession, setLoadingSession] = useState(!!sessionId)
    const sessionCreatedRef = useRef(false)

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
                // Notify the parent about the new session
                if (!sessionCreatedRef.current && onSessionCreated) {
                    sessionCreatedRef.current = true
                    // Extract the user's first message as title
                    const bodyStr = (init as RequestInit)?.body
                    let title = 'Neuer Chat'
                    if (typeof bodyStr === 'string') {
                        try {
                            const parsed = JSON.parse(bodyStr)
                            const userMsgs = parsed.messages?.filter(
                                (m: { role: string }) => m.role === 'user'
                            )
                            if (userMsgs?.length > 0) {
                                const parts = userMsgs[0].parts ?? []
                                const textPart = parts.find(
                                    (p: { type: string }) => p.type === 'text'
                                )
                                if (textPart?.text) {
                                    title = textPart.text.slice(0, 100)
                                }
                            }
                        } catch { /* ignore parse errors */ }
                    }
                    onSessionCreated(newSessionId, title)
                }
            }
            return response
        },
    }), [documentId, onSessionCreated])

    const { messages, sendMessage, status, setMessages, stop } = useChat<ChatMessage>({
        transport,
        messageMetadataSchema,
    })

    // Load previous messages when sessionId is provided
    useEffect(() => {
        if (!sessionId) {
            setLoadingSession(false)
            return
        }

        async function loadSession() {
            try {
                const session = await getSession(sessionId!)
                if (session?.messages && session.messages.length > 0) {
                    setMessages(storedToUIMessages(session.messages as unknown as StoredMessage[]))
                }
            } catch (err) {
                console.error('Failed to load session messages:', err)
            } finally {
                setLoadingSession(false)
            }
        }
        loadSession()
    }, [sessionId, setMessages])

    const isLoading = status === 'streaming' || status === 'submitted'

    function handleSubmit({ text }: PromptInputMessage) {
        const trimmed = text.trim()
        if (!trimmed || isLoading) return
        sendMessage({ text: trimmed })
    }

    // Toggle a source in the detail panel
    function handleSourceClick(source: StoredSource) {
        setActiveSource(source)
    }

    if (loadingSession) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex h-full gap-0">
            {/* Main chat area */}
            <div className="flex-1 flex flex-col min-w-0">
                <Conversation className="flex-1">
                    <ConversationContent>
                        {messages.length === 0 && (
                            <ConversationEmptyState
                                title="Lernassistent"
                                description="Stelle eine Frage zu deinen Dokumenten. Der Assistent antwortet basierend auf den hochgeladenen Inhalten und zitiert die Quellen."
                                icon={<BookOpen className="h-12 w-12" />}
                            />
                        )}

                        {messages.map((message) => (
                            <Fragment key={message.id}>
                                {message.parts.map((part, i) => {
                                    if (part.type === 'text') {
                                        return (
                                            <Message key={i} from={message.role}>
                                                <MessageContent>
                                                    {message.role === 'user' ? (
                                                        <p className="whitespace-pre-wrap">{part.text}</p>
                                                    ) : (
                                                        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                                                        <div onClick={(e) => {
                                                            const anchor = (e.target as HTMLElement).closest('a')
                                                            const href = anchor?.getAttribute('href')
                                                            if (!href?.startsWith('#cite-')) return
                                                            e.preventDefault()
                                                            const idx = parseInt(href.slice(6))
                                                            const src = message.metadata?.sources?.find((s) => s.index === idx)
                                                            if (src) handleSourceClick(src)
                                                        }}>
                                                            <MessageResponse linkSafety={{ enabled: false }}>
                                                                {linkifyCitations(part.text)}
                                                            </MessageResponse>
                                                        </div>
                                                    )}
                                                </MessageContent>
                                            </Message>
                                        )
                                    }
                                    return null
                                })}

                                {message.role === 'assistant' && message.metadata?.sources && message.metadata.sources.length > 0 && (
                                    <Sources>
                                        <SourcesTrigger count={message.metadata.sources.length}>
                                            <p className="font-medium">{message.metadata.sources.length} Quellen verwendet</p>
                                            <ChevronDown className="h-4 w-4" />
                                        </SourcesTrigger>
                                        <SourcesContent>
                                            {message.metadata.sources.map((src) => (
                                                <button
                                                    key={src.chunkId}
                                                    type="button"
                                                    className="flex items-center gap-2 text-left cursor-pointer hover:underline"
                                                    onClick={() => handleSourceClick(src)}
                                                >
                                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                                    <span className="font-medium">{prettifyTitle(src.documentTitle)}</span>
                                                    {src.pageNumber != null && (
                                                        <span className="text-muted-foreground">S.{src.pageNumber}</span>
                                                    )}
                                                </button>
                                            ))}
                                        </SourcesContent>
                                    </Sources>
                                )}
                            </Fragment>
                        ))}

                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <Shimmer>Denke nach...</Shimmer>
                        )}
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>

                {/* Input */}
                <div className="border-t border-border p-4">
                    <PromptInput onSubmit={handleSubmit}>
                        <PromptInputBody>
                            <PromptInputTextarea placeholder="Stelle eine Frage zu deinen Dokumenten..." />
                        </PromptInputBody>
                        <PromptInputFooter>
                            <PromptInputTools>
                                <PromptInputButton
                                    tooltip={{ content: 'Absenden', shortcut: '↵' }}
                                    variant="ghost"
                                    disabled
                                    className="pointer-events-none text-muted-foreground/50"
                                >
                                    <CornerDownLeft className="size-3.5" />
                                    <span className="text-xs">Enter</span>
                                </PromptInputButton>
                            </PromptInputTools>
                            <PromptInputSubmit status={status} onStop={stop} />
                        </PromptInputFooter>
                    </PromptInput>
                </div>
            </div>

            {/* Source detail panel (right side) — only rendered when a source is selected */}
            {activeSource && (
                <>
                    {/* Backdrop for small screens */}
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <div
                        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                        onClick={() => setActiveSource(null)}
                    />
                    <aside className="max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-50 w-80 sm:w-96 border-l border-border bg-background text-foreground overflow-y-auto shadow-lg lg:shadow-none">
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                        {activeSource.index}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                            <span className="text-sm font-medium truncate">{prettifyTitle(activeSource.documentTitle)}</span>
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
                            <div className="rounded-lg border border-border bg-muted/50 p-4">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {activeSource.content || activeSource.snippet || 'Kein Inhalt verfügbar.'}
                                </p>
                            </div>
                        </div>
                    </aside>
                </>
            )}
        </div>
    )
}
