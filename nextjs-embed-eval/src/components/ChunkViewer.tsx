'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'

interface Chunk {
    id: string
    content: string
    chunkIndex: number
    tokenCount: number
}

interface ChunkViewerProps {
    chunks: Chunk[]
    selectedChunkId?: string | null
    onSelect?: (chunkId: string) => void
}

export function ChunkViewer({ chunks, selectedChunkId, onSelect }: ChunkViewerProps) {
    return (
        <div className="space-y-3">
            {chunks.map(chunk => (
                <Card
                    key={chunk.id}
                    className={`cursor-pointer transition-colors ${
                        selectedChunkId === chunk.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-muted-foreground/30'
                    }`}
                    onClick={() => onSelect?.(chunk.id)}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">
                                Chunk {chunk.chunkIndex}
                            </CardTitle>
                            <Badge variant="secondary">
                                ~{chunk.tokenCount} Token
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-4">
                            {chunk.content}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
