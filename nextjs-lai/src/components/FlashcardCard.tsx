'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { FileText } from 'lucide-react'
import { TTSButton } from '@/src/components/TTSButton'

interface FlashcardCardProps {
    front: string
    back: string
    context?: string | null
    document?: { id: string; title: string } | null
    chunk?: { id: string; content: string; chunkIndex: number } | null
    flipped: boolean
    onFlip: () => void
    className?: string
    onClick?: () => void
    onSourceClick?: () => void
    lang?: string
}

/**
 * Reusable flashcard display component with TTS support.
 * Can be used in flip mode (3D rotation) or static display.
 */
export function FlashcardCard({
    front,
    back,
    context,
    document,
    chunk,
    flipped,
    onFlip,
    className = '',
    onClick,
    onSourceClick,
    lang = 'de-DE',
}: FlashcardCardProps) {
    const handleClick = useCallback(() => {
        if (!flipped) {
            onFlip()
        }
        onClick?.()
    }, [flipped, onFlip, onClick])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if ((e.key === 'Enter' || e.key === ' ') && !flipped) {
                e.preventDefault()
                onFlip()
            }
        },
        [flipped, onFlip]
    )

    return (
        <div
            className={`perspective-1000 cursor-pointer ${className}`}
            role="button"
            tabIndex={0}
            aria-label={flipped ? 'Karteikarte — Antwortseite' : 'Karteikarte umdrehen'}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <div
                className={`relative transition-transform duration-500 [transform-style:preserve-3d] ${
                    flipped ? '[transform:rotateY(180deg)]' : ''
                }`}
            >
                {/* Front */}
                <Card className="[backface-visibility:hidden] min-h-[200px]">
                    <CardContent className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
                        {document && (
                            <Badge variant="outline" className="mb-4">
                                {document.title}
                            </Badge>
                        )}
                        <div className="flex items-center gap-3 justify-center">
                            <p className="text-xl font-semibold">{front}</p>
                            <div onClick={(e) => e.stopPropagation()}>
                                <TTSButton text={front} lang={lang} size="sm" />
                            </div>
                        </div>
                        {!flipped && (
                            <p className="text-sm text-muted-foreground mt-6">
                                Klicken zum Umdrehen
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Back */}
                <Card className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] min-h-[200px]">
                    <CardContent className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
                        {/* Show question as subtle reference on the answer side */}
                        <div className="flex items-center gap-2 justify-center mb-3">
                            <p className="text-xs text-muted-foreground italic">{front}</p>
                            <div onClick={(e) => e.stopPropagation()}>
                                <TTSButton text={front} lang={lang} size="sm" />
                            </div>
                        </div>
                        <p className="text-lg">{back}</p>
                        {context && (
                            <p className="text-sm text-muted-foreground mt-4 italic">{context}</p>
                        )}
                        {chunk && onSourceClick && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onSourceClick()
                                }}
                                className="mt-4 pt-3 border-t w-full text-left hover:bg-accent/50 rounded-md p-2 -mx-2 transition-colors cursor-pointer"
                            >
                                <p className="text-xs font-medium text-primary flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Quelle — Abschnitt {chunk.chunkIndex + 1}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {chunk.content}
                                </p>
                            </button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
