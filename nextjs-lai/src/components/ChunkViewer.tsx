'use client'

import { useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

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

const CHUNKS_PER_PAGE = 20

export const ChunkViewer = forwardRef<ChunkViewerHandle, ChunkViewerProps>(
    function ChunkViewer({ chunks }, ref) {
        const [expandedId, setExpandedId] = useState<string | null>(null)
        const [currentPage, setCurrentPage] = useState(1)
        const scrollAreaRef = useRef<HTMLDivElement>(null)

        const totalPages = Math.ceil(chunks.length / CHUNKS_PER_PAGE)
        const startIndex = (currentPage - 1) * CHUNKS_PER_PAGE
        const endIndex = startIndex + CHUNKS_PER_PAGE
        const paginatedChunks = chunks.slice(startIndex, endIndex)

        useImperativeHandle(ref, () => ({
            scrollToChunk(chunkIndex: number) {
                // Calculate which page the chunk is on
                const targetPage = Math.floor(chunkIndex / CHUNKS_PER_PAGE) + 1
                setCurrentPage(targetPage)

                // Expand the target chunk
                const chunk = chunks.find((c) => c.chunkIndex === chunkIndex)
                if (chunk) {
                    setExpandedId(chunk.id)

                    // Scroll to the chunk after page change
                    setTimeout(() => {
                        const el = document.getElementById(`chunk-${chunkIndex}`)
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                    }, 100)
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
            <div className="space-y-4">
                <ScrollArea ref={scrollAreaRef} className="h-[600px]">
                    <div className="space-y-3 pr-4">
                        {paginatedChunks.map((chunk) => {
                            const isExpanded = expandedId === chunk.id
                            const preview = chunk.content.length > 200 && !isExpanded
                                ? chunk.content.slice(0, 200) + '...'
                                : chunk.content

                            return (
                                <Card
                                    key={chunk.id}
                                    id={`chunk-${chunk.chunkIndex}`}
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="text-sm text-muted-foreground">
                            Abschnitte {startIndex + 1} bis {Math.min(endIndex, chunks.length)} von {chunks.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                title="Erste Seite"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                title="Vorherige Seite"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium min-w-[100px] text-center">
                                Seite {currentPage} von {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                title="Nächste Seite"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                title="Letzte Seite"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }
)
