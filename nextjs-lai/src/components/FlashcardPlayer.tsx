'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/src/components/ui/sheet'
import { reviewFlashcard } from '@/src/actions/flashcards'
import { Loader2, FileText, SkipForward } from 'lucide-react'
import { FlashcardCard } from '@/src/components/FlashcardCard'

interface FlashcardItem {
    id: string
    front: string
    back: string
    context?: string | null
    document?: { id: string; title: string } | null
    chunk?: { id: string; content: string; chunkIndex: number } | null
}

export interface ReviewResult {
    cardId: string
    quality: number
}

interface FlashcardPlayerProps {
    cards: FlashcardItem[]
    onComplete: (results: ReviewResult[]) => void
}

const RATINGS = [
    { quality: 1, label: 'Kenne ich nicht', variant: 'destructive' as const },
    { quality: 3, label: 'Unsicher', variant: 'outline' as const },
    { quality: 5, label: 'Kenne ich', variant: 'default' as const },
]

export function FlashcardPlayer({ cards: initialCards, onComplete }: FlashcardPlayerProps) {
    const [queue, setQueue] = useState<FlashcardItem[]>(initialCards)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [results, setResults] = useState<ReviewResult[]>([])
    const [sourceOpen, setSourceOpen] = useState(false)

    const card = queue[currentIndex]
    const remaining = queue.length - currentIndex
    const progressValue = (results.length / initialCards.length) * 100
    const isLast = currentIndex === queue.length - 1

    const handleFlip = useCallback(() => {
        if (!flipped) setFlipped(true)
    }, [flipped])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleFlip()
        }
    }, [handleFlip])

    async function handleRate(quality: number) {
        if (!card || submitting) return
        setSubmitting(true)

        try {
            await reviewFlashcard(card.id, quality)
            const updated = [...results, { cardId: card.id, quality }]
            setResults(updated)

            if (isLast) {
                onComplete(updated)
                return
            }

            setCurrentIndex((i) => i + 1)
            setFlipped(false)
            setSourceOpen(false)
        } catch (err) {
            console.error('Rating failed:', err)
        } finally {
            setSubmitting(false)
        }
    }

    function handleSkip() {
        if (!card || submitting || remaining <= 1) return
        setQueue((prev) => {
            const next = [...prev]
            const [skipped] = next.splice(currentIndex, 1)
            next.push(skipped)
            return next
        })
        setFlipped(false)
        setSourceOpen(false)
    }

    if (!card) return null

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Progress value={progressValue} />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Karteikarten lernen</span>
                    <span>
                        {results.length + 1} von {initialCards.length}
                    </span>
                </div>
            </div>

            {/* Card with flip animation and TTS */}
            <FlashcardCard
                front={card.front}
                back={card.back}
                context={card.context}
                document={card.document}
                chunk={card.chunk}
                flipped={flipped}
                onFlip={handleFlip}
                onSourceClick={() => setSourceOpen(true)}
            />

            {/* Rating buttons — only visible after flip */}
            {flipped && (
                <div className="space-y-3">
                    <p className="text-xs text-center text-muted-foreground">
                        Wie gut konntest du die Antwort?
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                        {RATINGS.map((r) => (
                            <Button
                                key={r.quality}
                                variant={r.variant}
                                onClick={() => handleRate(r.quality)}
                                disabled={submitting}
                                className="w-full sm:w-auto sm:min-w-[140px]"
                            >
                                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {r.label}
                            </Button>
                        ))}
                    </div>
                    {remaining > 1 && (
                        <div className="flex justify-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSkip}
                                disabled={submitting}
                                className="text-muted-foreground"
                            >
                                <SkipForward className="h-3.5 w-3.5 mr-1" />
                                Überspringen
                            </Button>
                        </div>
                    )}
                    {currentIndex === 0 && results.length === 0 && (
                        <p className="text-xs text-center text-muted-foreground">
                            Deine Bewertung steuert, wann die Karte wieder erscheint:
                            {' '}<span className="font-medium">Kenne ich</span> = längere Pause,
                            {' '}<span className="font-medium">Kenne ich nicht</span> = kommt bald wieder.
                        </p>
                    )}
                </div>
            )}

            {/* Source detail sheet */}
            <Sheet open={sourceOpen} onOpenChange={setSourceOpen}>
                <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
                    <SheetHeader>
                        <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                {card.chunk ? card.chunk.chunkIndex + 1 : '?'}
                            </span>
                            <div className="min-w-0">
                                <SheetTitle className="flex items-center gap-1.5 text-sm">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{card.document?.title}</span>
                                </SheetTitle>
                                <SheetDescription>
                                    Abschnitt {card.chunk ? card.chunk.chunkIndex + 1 : '—'}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                    <div className="px-4 pb-4">
                        <div className="rounded-lg border border-border bg-muted/50 p-4">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {card.chunk?.content}
                            </p>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
