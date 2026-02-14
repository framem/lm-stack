'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot } from 'lucide-react'
import { SourceCitation } from '@/src/components/SourceCitation'

interface StoredSource {
    index: number
    documentId: string
    documentTitle: string
    pageNumber: number | null
    chunkId: string
    snippet: string
    content: string
}

interface ChatMessageBubbleProps {
    role: 'user' | 'assistant'
    content: string
    sources?: StoredSource[]
    activeSourceChunkId?: string | null
    onSourceClick?: (source: StoredSource) => void
}

// Single chat message with markdown rendering and optional citation badges
export function ChatMessageBubble({ role, content, sources, activeSourceChunkId, onSourceClick }: ChatMessageBubbleProps) {
    const isUser = role === 'user'

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div className={`flex flex-col gap-2 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-card border border-border rounded-tl-sm'
                }`}>
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{content}</p>
                    ) : (
                        <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {sources && sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {sources.map((source) => (
                            <SourceCitation
                                key={source.chunkId}
                                index={source.index}
                                documentTitle={source.documentTitle}
                                pageNumber={source.pageNumber}
                                active={activeSourceChunkId === source.chunkId}
                                onClick={() => onSourceClick?.(source)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
