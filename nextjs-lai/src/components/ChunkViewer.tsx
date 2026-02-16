'use client'

import { useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { ScrollArea } from '@/src/components/ui/scroll-area'

interface ChunkViewerProps {
    chunks: {
        id: string
        content: string
        chunkIndex: number
        pageNumber: number | null
        tokenCount: number | null
    }[]
}

export interface ChunkViewerHandle {
    scrollToChunk: (chunkIndex: number) => void
}

export const ChunkViewer = forwardRef<ChunkViewerHandle, ChunkViewerProps>(
    function ChunkViewer({ chunks }, ref) {
        const [expandedId, setExpandedId] = useState<string | null>(null)
        const chunkRefs = useRef<Map<number, HTMLDivElement>>(new Map())

        useImperativeHandle(ref, () => ({
            scrollToChunk(chunkIndex: number) {
                const el = chunkRefs.current.get(chunkIndex)
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    // Expand the target chunk
                    const chunk = chunks.find((c) => c.chunkIndex === chunkIndex)
                    if (chunk) setExpandedId(chunk.id)
                }
            },
        }))

        if (chunks.length === 0) {
            return (
                <p className="text-muted-foreground text-center py-8">
                    Keine Abschnitte vorhanden.
                </p>
            )
        }

        return (
            <ScrollArea className="h-[600px]">
                <div className="space-y-3 pr-4">
                    {chunks.map((chunk) => {
                        const isExpanded = expandedId === chunk.id
                        const preview = chunk.content.length > 200 && !isExpanded
                            ? chunk.content.slice(0, 200) + '...'
                            : chunk.content

                        return (
                            <Card
                                key={chunk.id}
                                id={`chunk-${chunk.chunkIndex}`}
                                ref={(el) => {
                                    if (el) chunkRefs.current.set(chunk.chunkIndex, el)
                                    else chunkRefs.current.delete(chunk.chunkIndex)
                                }}
                                className="cursor-pointer transition-colors hover:bg-accent/30"
                                onClick={() => setExpandedId(isExpanded ? null : chunk.id)}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                        Abschnitt {chunk.chunkIndex + 1}
                                    </CardTitle>
                                    <CardDescription className="flex gap-2">
                                        {chunk.pageNumber && (
                                            <Badge variant="outline">Seite {chunk.pageNumber}</Badge>
                                        )}
                                        {chunk.tokenCount && (
                                            <Badge variant="outline">~{chunk.tokenCount} Tokens</Badge>
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{preview}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </ScrollArea>
        )
    }
)
