'use client'

import { Fragment, useState, useMemo, useEffect, useRef } from 'react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useChat } from '@ai-sdk/react'
import { z } from 'zod'
import { BookOpen, FileText, Loader2, ChevronDown, CornerDownLeft, Check, AlertTriangle } from 'lucide-react'
import { getSession } from '@/src/actions/chat'
import { getDocuments } from '@/src/actions/documents'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/src/components/ui/sheet'

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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/src/components/ui/popover'
import {
    Sources,
    SourcesTrigger,
    SourcesContent,
} from '@/src/components/ai-elements/sources'
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/src/components/ai-elements/reasoning'
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
    noContext: z.boolean().optional(),
})

type ChatMessage = UIMessage<z.infer<typeof messageMetadataSchema>>

// Turn [Quelle N] references in assistant text into clickable markdown links.
// Handles standard [Quelle N], bare Quelle N, and range patterns.
function linkifyCitations(text: string): string {
    // First expand ranges like "Quelle 2–Quelle 5" or "[Quelle 2–5]" into individual markers
    let result = text.replace(
        /\[?Quelle\s+(\d+)\s*[–\-]\s*(?:Quelle\s+)?(\d+)\]?/g,
        (_, start, end) => {
            const s = parseInt(start, 10)
            const e = parseInt(end, 10)
            return Array.from({ length: e - s + 1 }, (__, i) => `[Quelle ${s + i}]`).join(' ')
        }
    )
    // Then convert [Quelle N] to markdown links
    result = result.replace(/\[Quelle\s+(\d+)\](?!\()/g, '[Quelle $1](#cite-$1)')
    // Also catch bare Quelle N (not already inside a link)
    result = result.replace(/(?<!\[)Quelle\s+(\d+)(?!\s*\]|\))/g, '[Quelle $1](#cite-$1)')
    return result
}


// Extract <think>...</think> blocks from text, returning reasoning and cleaned text
function extractThinkBlocks(text: string): { reasoning: string; text: string; isThinking: boolean } {
    const completed = [...text.matchAll(/<think>([\s\S]*?)<\/think>/g)]
    const parts = completed.map(m => m[1].trim())

    // Check for unclosed <think> tag (still streaming reasoning)
    const lastOpen = text.lastIndexOf('<think>')
    const lastClose = text.lastIndexOf('</think>')
    const isThinking = lastOpen !== -1 && lastOpen > lastClose

    if (isThinking) {
        parts.push(text.slice(lastOpen + 7).trim())
    }

    // Strip think blocks from text
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '')
    if (isThinking) {
        cleaned = cleaned.slice(0, cleaned.lastIndexOf('<think>'))
    }

    return { reasoning: parts.filter(Boolean).join('\n\n'), text: cleaned.trim(), isThinking }
}

// German localization for the Reasoning trigger
const getGermanThinkingMessage = (isStreaming: boolean, duration?: number) => {
    if (isStreaming || duration === 0) {
        return <Shimmer duration={1}>Denkt nach...</Shimmer>
    }
    if (duration === undefined) {
        return <p>Hat kurz nachgedacht</p>
    }
    return <p>{duration} Sekunden nachgedacht</p>
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
    // Track session IDs created during this component's lifetime (to skip reloading)
    const justCreatedSessionRef = useRef<string | null>(null)
    const prevSessionIdRef = useRef(sessionId)

    const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>(
        documentId ? [documentId] : []
    )
    const selectedDocumentIdsRef = useRef(selectedDocumentIds)
    const [documents, setDocuments] = useState<{ id: string; title: string }[]>([])

    useEffect(() => {
        selectedDocumentIdsRef.current = selectedDocumentIds
    }, [selectedDocumentIds])

    useEffect(() => {
        getDocuments().then((docs) =>
            setDocuments(docs.map((d) => ({ id: d.id, title: d.title })))
        ).catch(() => {})
    }, [])

    const activeSessionIdRef = useRef(activeSessionId)

    useEffect(() => {
        activeSessionIdRef.current = activeSessionId
    }, [activeSessionId])

    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
            sessionId: activeSessionIdRef.current,
            documentIds: selectedDocumentIdsRef.current.length > 0 ? selectedDocumentIdsRef.current : undefined,
        }),
        fetch: async (url, init) => {
            const response = await globalThis.fetch(url as string, init as RequestInit)
            const newSessionId = response.headers.get('X-Session-Id')
            if (newSessionId && !activeSessionIdRef.current) {
                justCreatedSessionRef.current = newSessionId
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
    }), [onSessionCreated])

    const { messages, sendMessage, status, setMessages, stop } = useChat<ChatMessage>({
        transport,
        messageMetadataSchema,
    })

    // Handle sessionId prop changes: initial load + sidebar navigation
    useEffect(() => {
        const prev = prevSessionIdRef.current
        prevSessionIdRef.current = sessionId

        // Skip when session was just created during this chat (messages already in state)
        if (sessionId && sessionId === justCreatedSessionRef.current) {
            justCreatedSessionRef.current = null
            setLoadingSession(false)
            return
        }

        // Skip on initial mount when sessionId hasn't changed
        if (prev === sessionId && prev !== undefined) return

        // Navigated to a different session or new chat via sidebar
        if (prev !== sessionId && prev !== undefined) {
            setActiveSessionId(sessionId)
            setActiveSource(null)
            sessionCreatedRef.current = false
            justCreatedSessionRef.current = null
        }

        if (!sessionId) {
            setMessages([])
            setLoadingSession(false)
            return
        }

        setLoadingSession(true)
        getSession(sessionId)
            .then((session) => {
                if (session?.messages && session.messages.length > 0) {
                    setMessages(storedToUIMessages(session.messages as unknown as StoredMessage[]))
                } else {
                    setMessages([])
                }
            })
            .catch((err) => console.error('Failed to load session messages:', err))
            .finally(() => setLoadingSession(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId])

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
                    <ConversationContent className="max-w-3xl mx-auto w-full">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 gap-6">
                                <ConversationEmptyState
                                    title="Lernassistent"
                                    description="Stelle eine Frage zu deinem Lernmaterial. Der Assistent antwortet basierend auf den hochgeladenen Inhalten und zitiert die Quellen."
                                    icon={<BookOpen className="h-12 w-12" />}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                                    {[
                                        'Fasse das Dokument zusammen',
                                        'Erkläre die wichtigsten Konzepte',
                                        'Erstelle mir eine Übersicht',
                                        'Was sind die Kernaussagen?',
                                    ].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            className="text-left text-sm px-4 py-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                                            onClick={() => sendMessage({ text: suggestion })}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message, msgIdx) => {
                            const isLastMessage = msgIdx === messages.length - 1

                            // Collect reasoning from native parts and <think> blocks in text
                            let reasoningText = ''
                            let hasPartialThink = false
                            if (message.role === 'assistant') {
                                const chunks: string[] = []
                                for (const part of message.parts) {
                                    if (part.type === 'reasoning') {
                                        chunks.push(part.text)
                                    } else if (part.type === 'text') {
                                        const parsed = extractThinkBlocks(part.text)
                                        if (parsed.reasoning) chunks.push(parsed.reasoning)
                                        if (parsed.isThinking) hasPartialThink = true
                                    }
                                }
                                reasoningText = chunks.filter(Boolean).join('\n\n')
                            }

                            const lastPart = message.parts.at(-1)
                            const isReasoningStreaming = isLastMessage && isLoading && (
                                lastPart?.type === 'reasoning' || hasPartialThink
                            )

                            return (
                                <Fragment key={message.id}>
                                    {reasoningText && (
                                        <Reasoning isStreaming={isReasoningStreaming}>
                                            <ReasoningTrigger getThinkingMessage={getGermanThinkingMessage} />
                                            <ReasoningContent>{reasoningText}</ReasoningContent>
                                        </Reasoning>
                                    )}

                                    {message.role === 'assistant' && message.metadata?.noContext && (
                                        <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-2.5 text-sm text-orange-400">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            <span>Keine passenden Quellen gefunden. Versuche eine andere Formulierung oder prüfe, ob relevantes Lernmaterial hochgeladen ist.</span>
                                        </div>
                                    )}

                                    {message.parts.map((part, i) => {
                                        if (part.type === 'reasoning') return null
                                        if (part.type === 'text') {
                                            const displayText = message.role === 'assistant'
                                                ? extractThinkBlocks(part.text).text
                                                : part.text
                                            if (!displayText) return null

                                            return (
                                                <Message key={i} from={message.role}>
                                                    <MessageContent>
                                                        {message.role === 'user' ? (
                                                            <p className="whitespace-pre-wrap">{displayText}</p>
                                                        ) : (
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
                                                                    {linkifyCitations(displayText)}
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
                                                <p className="font-medium">{message.metadata.sources.length === 1 ? '1 Quelle' : `${message.metadata.sources.length} Quellen`}</p>
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
                                                        <span className="font-medium">{src.documentTitle}</span>
                                                        {src.pageNumber != null && (
                                                            <span className="text-muted-foreground">S.{src.pageNumber}</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </SourcesContent>
                                        </Sources>
                                    )}
                                </Fragment>
                            )
                        })}

                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <Shimmer>Denke nach...</Shimmer>
                        )}
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>

                {/* Input */}
                <div className="border-t border-border p-4">
                  <div className="max-w-3xl mx-auto w-full">
                    <PromptInput onSubmit={handleSubmit}>
                        <PromptInputBody>
                            <PromptInputTextarea placeholder="Stelle eine Frage zu deinem Lernmaterial..." />
                        </PromptInputBody>
                        <PromptInputFooter>
                            <PromptInputTools>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                        >
                                            <FileText className="size-3.5" />
                                            <span>
                                                {selectedDocumentIds.length === 0
                                                    ? 'Alle Lernmaterialien'
                                                    : selectedDocumentIds.length === 1
                                                      ? documents.find(d => d.id === selectedDocumentIds[0])?.title ?? '1 Lernmaterial'
                                                      : `${selectedDocumentIds.length} Lernmaterialien`}
                                            </span>
                                            <ChevronDown className="size-3.5 opacity-50" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent align="start" className="w-64 max-h-72 overflow-y-auto p-1">
                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                            onClick={() => setSelectedDocumentIds([])}
                                        >
                                            <span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary">
                                                {selectedDocumentIds.length === 0 && (
                                                    <Check className="size-3" />
                                                )}
                                            </span>
                                            Alle Lernmaterialien
                                        </button>
                                        {documents.map((doc) => {
                                            const isChecked = selectedDocumentIds.includes(doc.id)
                                            return (
                                                <button
                                                    key={doc.id}
                                                    type="button"
                                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                                    onClick={() => {
                                                        setSelectedDocumentIds(prev =>
                                                            isChecked
                                                                ? prev.filter(id => id !== doc.id)
                                                                : [...prev, doc.id]
                                                        )
                                                    }}
                                                >
                                                    <span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary">
                                                        {isChecked && <Check className="size-3" />}
                                                    </span>
                                                    <span className="truncate">{doc.title}</span>
                                                </button>
                                            )
                                        })}
                                    </PopoverContent>
                                </Popover>
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
            </div>

            {/* Source detail sheet (slides in from right) */}
            <Sheet open={!!activeSource} onOpenChange={(open) => { if (!open) setActiveSource(null) }}>
                <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
                    <SheetHeader>
                        <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                {activeSource?.index}
                            </span>
                            <div className="min-w-0">
                                <SheetTitle className="flex items-center gap-1.5 text-sm">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{activeSource?.documentTitle}</span>
                                </SheetTitle>
                                {activeSource?.pageNumber != null && (
                                    <SheetDescription>Seite {activeSource.pageNumber}</SheetDescription>
                                )}
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="px-4 pb-4">
                        <div className="rounded-lg border border-border bg-muted/50 p-4">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {activeSource?.content || activeSource?.snippet || 'Kein Inhalt verfügbar.'}
                            </p>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
