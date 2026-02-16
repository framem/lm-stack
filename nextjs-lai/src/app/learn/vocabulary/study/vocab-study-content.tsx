'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    Loader2,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Languages,
    ArrowLeftRight,
    Keyboard,
    RotateCcw,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { VocabTypeInput } from '@/src/components/VocabTypeInput'
import { TTSButton } from '@/src/components/TTSButton'
import { ConjugationTable } from '@/src/components/ConjugationTable'
import { reviewFlashcard } from '@/src/actions/flashcards'
import { getDueVocabularyFlashcards, getVocabularyFlashcards } from '@/src/actions/flashcards'

interface ConjugationData {
    present?: Record<string, string>
    past?: Record<string, string>
    perfect?: Record<string, string>
}

interface VocabCard {
    id: string
    front: string
    back: string
    exampleSentence?: string | null
    partOfSpeech?: string | null
    conjugation?: ConjugationData | null
    context?: string | null
    document?: { id: string; title: string } | null
    chunk?: { id: string; content: string; chunkIndex: number } | null
}

interface ReviewResult {
    cardId: string
    quality: number
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const RATINGS = [
    { quality: 1, label: 'Kenne ich nicht', variant: 'destructive' as const },
    { quality: 3, label: 'Unsicher', variant: 'outline' as const },
    { quality: 5, label: 'Kenne ich', variant: 'default' as const },
]

export function VocabStudyContent() {
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode') || 'flip'
    const practiceAll = searchParams.get('all') === 'true'

    const [cards, setCards] = useState<VocabCard[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [reversed, setReversed] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [results, setResults] = useState<ReviewResult[]>([])
    const [completed, setCompleted] = useState(false)
    const [typeResult, setTypeResult] = useState<{ isCorrect: boolean; similarity: number } | null>(null)

    useEffect(() => {
        async function load() {
            try {
                if (practiceAll) {
                    const data = await getVocabularyFlashcards()
                    setCards(shuffle(data as unknown as VocabCard[]))
                } else {
                    const data = await getDueVocabularyFlashcards()
                    setCards(data as unknown as VocabCard[])
                }
            } catch (err) {
                console.error('Failed to load vocabulary:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [practiceAll])

    const card = cards[currentIndex]
    const progressValue = cards.length > 0 ? (results.length / cards.length) * 100 : 0
    const isLast = currentIndex === cards.length - 1

    // In reversed mode, swap front and back
    const displayFront = card ? (reversed ? card.back : card.front) : ''
    const displayBack = card ? (reversed ? card.front : card.back) : ''
    const isVerb = card?.partOfSpeech?.toLowerCase().includes('verb') ?? false

    const handleFlip = useCallback(() => {
        if (!flipped) setFlipped(true)
    }, [flipped])

    async function handleRate(quality: number) {
        if (!card || submitting) return
        setSubmitting(true)
        try {
            await reviewFlashcard(card.id, quality)
            const updated = [...results, { cardId: card.id, quality }]
            setResults(updated)

            if (isLast) {
                setCompleted(true)
                return
            }

            setCurrentIndex((i) => i + 1)
            setFlipped(false)
            setTypeResult(null)
        } catch (err) {
            console.error('Rating failed:', err)
        } finally {
            setSubmitting(false)
        }
    }

    function handleTypeResult(isCorrect: boolean, similarity: number) {
        setTypeResult({ isCorrect, similarity })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (cards.length === 0) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center space-y-6 mt-16">
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Alles gelernt!</h1>
                    <p className="text-muted-foreground mt-2">
                        Aktuell sind keine Vokabeln zur Wiederholung fällig.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/learn/vocabulary">
                        <Languages className="h-4 w-4" />
                        Zurück zum Vokabeltrainer
                    </Link>
                </Button>
            </div>
        )
    }

    // Completion screen
    if (completed) {
        const known = results.filter((r) => r.quality === 5).length
        const unsure = results.filter((r) => r.quality === 3).length
        const unknown = results.filter((r) => r.quality === 1).length
        const total = results.length

        return (
            <div className="p-6 max-w-2xl mx-auto space-y-8 mt-8">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">Vokabel-Session abgeschlossen!</h1>
                    <p className="text-muted-foreground">
                        Du hast {total} Vokabel{total !== 1 ? 'n' : ''} durchgearbeitet.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="flex flex-col items-center p-4 gap-2">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <span className="text-2xl font-bold">{known}</span>
                            <span className="text-xs text-muted-foreground">Gewusst</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-4 gap-2">
                            <HelpCircle className="h-6 w-6 text-yellow-600" />
                            <span className="text-2xl font-bold">{unsure}</span>
                            <span className="text-xs text-muted-foreground">Unsicher</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-4 gap-2">
                            <XCircle className="h-6 w-6 text-red-600" />
                            <span className="text-2xl font-bold">{unknown}</span>
                            <span className="text-xs text-muted-foreground">Nicht gewusst</span>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/learn/vocabulary">
                            <Languages className="h-4 w-4" />
                            Zurück zum Vokabeltrainer
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/learn">Dashboard</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            {/* Progress */}
            <div className="space-y-2">
                <Progress value={progressValue} />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        {mode === 'type' ? (
                            <><Keyboard className="h-4 w-4" /> Tipp-Modus</>
                        ) : (
                            <><RotateCcw className="h-4 w-4" /> Umdrehen-Modus</>
                        )}
                    </span>
                    <span>{results.length + 1} von {cards.length}</span>
                </div>
            </div>

            {/* Direction toggle */}
            <div className="flex justify-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setReversed((r) => !r)
                        setFlipped(false)
                        setTypeResult(null)
                    }}
                    className="text-muted-foreground"
                >
                    <ArrowLeftRight className="h-4 w-4" />
                    {reversed ? 'Antwort → Frage' : 'Frage → Antwort'}
                </Button>
            </div>

            {/* Card display */}
            {mode === 'type' ? (
                // Type mode
                <div className="space-y-4">
                    <Card className="min-h-[200px]">
                        <CardContent className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
                            {card.document && (
                                <Badge variant="outline" className="mb-4">{card.document.title}</Badge>
                            )}
                            {card.partOfSpeech && (
                                <Badge variant="secondary" className="mb-2">{card.partOfSpeech}</Badge>
                            )}
                            <div className="flex items-center gap-1">
                                <p className="text-xl font-semibold">{displayFront}</p>
                                <TTSButton text={displayFront} />
                            </div>
                        </CardContent>
                    </Card>

                    <VocabTypeInput
                        key={`${card.id}-${reversed}`}
                        correctAnswer={displayBack}
                        onResult={handleTypeResult}
                    />

                    {/* Show example sentence after answering */}
                    {typeResult && card.exampleSentence && (
                        <div className="rounded-lg border bg-muted/50 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Beispielsatz</p>
                            <p className="text-sm italic">{card.exampleSentence}</p>
                        </div>
                    )}

                    {/* Rating buttons after typing */}
                    {typeResult && (
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
                        </div>
                    )}
                </div>
            ) : (
                // Flip mode
                <div className="space-y-4">
                    <div
                        className="perspective-1000 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={flipped ? 'Karteikarte — Antwortseite' : 'Karteikarte umdrehen'}
                        onClick={handleFlip}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleFlip()
                            }
                        }}
                    >
                        <div
                            className={`relative transition-transform duration-500 [transform-style:preserve-3d] ${
                                flipped ? '[transform:rotateY(180deg)]' : ''
                            }`}
                        >
                            {/* Front */}
                            <Card className="[backface-visibility:hidden] min-h-[240px]">
                                <CardContent className="flex flex-col items-center justify-center min-h-[240px] p-8 text-center">
                                    {card.document && (
                                        <Badge variant="outline" className="mb-4">{card.document.title}</Badge>
                                    )}
                                    {card.partOfSpeech && (
                                        <Badge variant="secondary" className="mb-2">{card.partOfSpeech}</Badge>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <p className="text-xl font-semibold">{displayFront}</p>
                                        <TTSButton text={displayFront} />
                                    </div>
                                    {!flipped && (
                                        <p className="text-sm text-muted-foreground mt-6">Klicken zum Umdrehen</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Back */}
                            <Card className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] min-h-[240px]">
                                <CardContent className="flex flex-col items-center justify-center min-h-[240px] p-8 text-center">
                                    <p className="text-xs text-muted-foreground mb-3 italic">{displayFront}</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-lg">{displayBack}</p>
                                        <TTSButton text={displayBack} />
                                    </div>
                                    {card.exampleSentence && (
                                        <div className="flex items-center gap-1 mt-4">
                                            <p className="text-sm text-muted-foreground italic">
                                                {card.exampleSentence}
                                            </p>
                                            <TTSButton text={card.exampleSentence} size="sm" className="shrink-0 h-6 w-6" />
                                        </div>
                                    )}
                                    {isVerb && card.conjugation && (
                                        <ConjugationTable conjugation={card.conjugation} />
                                    )}
                                    {card.context && (
                                        <p className="text-xs text-muted-foreground mt-3 border-t pt-3">
                                            {card.context}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Rating buttons after flip */}
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
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
