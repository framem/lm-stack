'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/src/components/ui/sheet'
import { reviewFlashcard, getSchedulingPreview } from '@/src/actions/flashcards'
import { Loader2, FileText, SkipForward } from 'lucide-react'
import { toast } from 'sonner'
import { FlashcardCard } from '@/src/components/FlashcardCard'
import { BadgeUnlockToast } from '@/src/components/BadgeUnlockToast'
import { RATINGS } from '@/src/lib/constants'
import { Rating } from '@/src/lib/spaced-repetition'

interface FlashcardItem {
    id: string
    front: string
    back: string
    context?: string | null
    document?: { id: string; title: string; subject?: string | null } | null
    chunk?: { id: string; content: string; chunkIndex: number } | null
}

export interface ReviewResult {
    cardId: string
    rating: number
}

interface FlashcardPlayerProps {
    cards: FlashcardItem[]
    onComplete: (results: ReviewResult[]) => void
}

export function FlashcardPlayer({ cards: initialCards, onComplete }: FlashcardPlayerProps) {
    const [queue, setQueue] = useState<FlashcardItem[]>(initialCards)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [results, setResults] = useState<ReviewResult[]>([])
    const [sourceOpen, setSourceOpen] = useState(false)
    const [intervals, setIntervals] = useState<Record<number, string> | null>(null)

    const card = queue[currentIndex]
    const remaining = queue.length - currentIndex
    const progressValue = (results.length / initialCards.length) * 100
    const isLast = currentIndex === queue.length - 1

    const handleFlip = useCallback(() => {
        if (!flipped) setFlipped(true)
    }, [flipped])

    // Load scheduling preview when card is flipped
    useEffect(() => {
        if (!card || !flipped) return
        let cancelled = false
        setIntervals(null)
        getSchedulingPreview(card.id).then((preview) => {
            if (!cancelled) setIntervals(preview)
        }).catch(console.error)
        return () => { cancelled = true }
    }, [card, flipped])

    const handleRate = useCallback(async (rating: number) => {
        if (!card || submitting) return
        setSubmitting(true)

        try {
            const result = await reviewFlashcard(card.id, rating)
            if (result?.newBadges?.length) {
                for (const badge of result.newBadges) {
                    BadgeUnlockToast(badge)
                }
            }
            const updated = [...results, { cardId: card.id, rating }]
            setResults(updated)

            if (isLast) {
                onComplete(updated)
                return
            }

            setCurrentIndex((i) => i + 1)
            setFlipped(false)
            setSourceOpen(false)
            setIntervals(null)
        } catch (err) {
            console.error('Rating failed:', err)
            toast.error('Bewertung fehlgeschlagen. Bitte versuche es erneut.')
        } finally {
            setSubmitting(false)
        }
    }, [card, submitting, results, isLast, onComplete])

    // Keyboard shortcuts: 1-4 for ratings, Space to flip
    useEffect(() => {
        function handleGlobalKeyDown(e: KeyboardEvent) {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            if (flipped && !submitting) {
                const keyMap: Record<string, number> = {
                    '1': Rating.Again,
                    '2': Rating.Hard,
                    '3': Rating.Good,
                    '4': Rating.Easy,
                }
                const rating = keyMap[e.key]
                if (rating !== undefined) {
                    e.preventDefault()
                    handleRate(rating)
                    return
                }
            }

            if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault()
                handleFlip()
            }
        }
        window.addEventListener('keydown', handleGlobalKeyDown)
        return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [flipped, submitting, handleFlip, handleRate])

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
        setIntervals(null)
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
                        {RATINGS.map((r, i) => (
                            <Button
                                key={r.rating}
                                variant={r.variant}
                                onClick={() => handleRate(r.rating)}
                                disabled={submitting}
                                className="w-full sm:w-auto sm:min-w-[140px]"
                            >
                                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                <span className="flex flex-col items-center leading-tight">
                                    <span>{r.label} <kbd className="ml-1 text-[10px] opacity-50 font-mono">{i + 1}</kbd></span>
                                    {intervals && (
                                        <span className="text-[10px] opacity-70">{intervals[r.rating]}</span>
                                    )}
                                </span>
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
                            {' '}<span className="font-medium">Nochmal</span> = kommt bald wieder,
                            {' '}<span className="font-medium">Einfach</span> = längere Pause.
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
