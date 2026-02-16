'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    Loader2,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Layers,
    ArrowRight,
    GraduationCap,
    PenLine,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Textarea } from '@/src/components/ui/textarea'
import { getCombinedDueItems } from '@/src/actions/session'
import { reviewFlashcard } from '@/src/actions/flashcards'
import { evaluateAnswer } from '@/src/actions/quiz'

interface FlashcardData {
    id: string
    front: string
    back: string
    context?: string | null
    document?: { id: string; title: string } | null
    chunk?: { id: string; content: string; chunkIndex: number } | null
}

interface QuizData {
    id: string
    questionText: string
    options: unknown
    questionIndex: number
    questionType?: string
    quiz?: { id: string; title: string; document?: { id: string; title: string } | null }
}

interface SessionItem {
    type: 'flashcard' | 'quiz'
    id: string
    data: FlashcardData | QuizData
    overdueBy: number
}

const FLASHCARD_RATINGS = [
    { quality: 1, label: 'Kenne ich nicht', variant: 'destructive' as const },
    { quality: 3, label: 'Unsicher', variant: 'outline' as const },
    { quality: 5, label: 'Kenne ich', variant: 'default' as const },
]

interface SessionStats {
    flashcardsReviewed: number
    flashcardsKnown: number
    quizAnswered: number
    quizCorrect: number
}

export function SessionContent() {
    const [items, setItems] = useState<SessionItem[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [stats, setStats] = useState<SessionStats>({
        flashcardsReviewed: 0, flashcardsKnown: 0,
        quizAnswered: 0, quizCorrect: 0,
    })

    // Flashcard state
    const [flipped, setFlipped] = useState(false)

    // Quiz state
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [selectedIndices, setSelectedIndices] = useState<number[]>([])
    const [freeTextAnswer, setFreeTextAnswer] = useState('')
    const [quizResult, setQuizResult] = useState<{
        isCorrect: boolean
        correctIndex?: number | null
        correctIndices?: number[]
        explanation?: string
        freeTextScore?: number
        freeTextFeedback?: string
        correctAnswer?: string
    } | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const data = await getCombinedDueItems(30)
                setItems(data as unknown as SessionItem[])
            } catch (err) {
                console.error('Failed to load session items:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const currentItem = items[currentIndex]
    const progressPercent = items.length > 0 ? (currentIndex / items.length) * 100 : 0
    const totalItems = items.length

    const resetItemState = useCallback(() => {
        setFlipped(false)
        setSelectedIndex(null)
        setSelectedIndices([])
        setFreeTextAnswer('')
        setQuizResult(null)
    }, [])

    function advance() {
        if (currentIndex >= items.length - 1) {
            setCompleted(true)
            return
        }
        setCurrentIndex((i) => i + 1)
        resetItemState()
    }

    // Flashcard handlers
    async function handleFlashcardRate(quality: number) {
        if (!currentItem || submitting) return
        setSubmitting(true)
        try {
            await reviewFlashcard(currentItem.id, quality)
            setStats((s) => ({
                ...s,
                flashcardsReviewed: s.flashcardsReviewed + 1,
                flashcardsKnown: s.flashcardsKnown + (quality === 5 ? 1 : 0),
            }))
            advance()
        } catch (err) {
            console.error('Rating failed:', err)
        } finally {
            setSubmitting(false)
        }
    }

    // Quiz handlers
    async function handleQuizSubmit() {
        if (!currentItem || submitting) return
        const q = currentItem.data as QuizData
        const type = q.questionType || 'singleChoice'
        const isMulti = type === 'multipleChoice'
        const isFreetext = type === 'freetext'
        const isCloze = type === 'cloze'

        if (isMulti && selectedIndices.length === 0) return
        if (!isMulti && !isFreetext && !isCloze && selectedIndex === null) return
        if ((isFreetext || isCloze) && !freeTextAnswer.trim()) return

        setSubmitting(true)
        try {
            const result = await evaluateAnswer(
                currentItem.id,
                isFreetext || isCloze || isMulti ? null : selectedIndex,
                (isFreetext || isCloze) ? freeTextAnswer : undefined,
                isMulti ? selectedIndices : undefined,
            ) as typeof quizResult

            setQuizResult(result)
            setStats((s) => ({
                ...s,
                quizAnswered: s.quizAnswered + 1,
                quizCorrect: s.quizCorrect + (result?.isCorrect ? 1 : 0),
            }))
        } catch (err) {
            console.error('Quiz evaluation failed:', err)
        } finally {
            setSubmitting(false)
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Empty state
    if (items.length === 0) {
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
                        Aktuell sind keine Wiederholungen fällig. Schau später nochmal vorbei.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/learn">
                        <GraduationCap className="h-4 w-4" />
                        Zurück zum Dashboard
                    </Link>
                </Button>
            </div>
        )
    }

    // Completion screen
    if (completed) {
        const total = stats.flashcardsReviewed + stats.quizAnswered
        return (
            <div className="p-6 max-w-2xl mx-auto space-y-8 mt-8">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">Lern-Session abgeschlossen!</h1>
                    <p className="text-muted-foreground">
                        Du hast {total} {total === 1 ? 'Element' : 'Elemente'} durchgearbeitet.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {stats.flashcardsReviewed > 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center p-4 gap-2">
                                <Layers className="h-6 w-6 text-primary" />
                                <span className="text-2xl font-bold">{stats.flashcardsReviewed}</span>
                                <span className="text-xs text-muted-foreground">Karteikarten</span>
                                <span className="text-xs text-green-600">
                                    {stats.flashcardsKnown} gewusst
                                </span>
                            </CardContent>
                        </Card>
                    )}
                    {stats.quizAnswered > 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center p-4 gap-2">
                                <HelpCircle className="h-6 w-6 text-primary" />
                                <span className="text-2xl font-bold">{stats.quizAnswered}</span>
                                <span className="text-xs text-muted-foreground">Quizfragen</span>
                                <span className="text-xs text-green-600">
                                    {stats.quizCorrect} richtig
                                </span>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="flex justify-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/learn">
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    // Active session
    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            {/* Progress */}
            <div className="space-y-2">
                <Progress value={progressPercent} />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Lern-Session</span>
                    <span>{currentIndex + 1} von {totalItems}</span>
                </div>
            </div>

            {/* Current item */}
            {currentItem.type === 'flashcard' ? (
                <FlashcardItem
                    card={currentItem.data as FlashcardData}
                    flipped={flipped}
                    onFlip={() => setFlipped(true)}
                    onRate={handleFlashcardRate}
                    submitting={submitting}
                />
            ) : (
                <QuizItem
                    question={currentItem.data as QuizData}
                    selectedIndex={selectedIndex}
                    selectedIndices={selectedIndices}
                    freeTextAnswer={freeTextAnswer}
                    result={quizResult}
                    submitting={submitting}
                    onSelectIndex={setSelectedIndex}
                    onToggleIndex={(i) =>
                        setSelectedIndices((prev) =>
                            prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                        )
                    }
                    onFreeTextChange={setFreeTextAnswer}
                    onSubmit={handleQuizSubmit}
                    onNext={advance}
                />
            )}
        </div>
    )
}

// ── Flashcard sub-component ──

function FlashcardItem({
    card,
    flipped,
    onFlip,
    onRate,
    submitting,
}: {
    card: FlashcardData
    flipped: boolean
    onFlip: () => void
    onRate: (quality: number) => void
    submitting: boolean
}) {
    return (
        <div className="space-y-4">
            <Badge variant="secondary" className="gap-1">
                <Layers className="h-3 w-3" />
                Karteikarte
            </Badge>

            <div
                className="perspective-1000 cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={flipped ? 'Karteikarte — Antwortseite' : 'Karteikarte umdrehen'}
                onClick={() => { if (!flipped) onFlip() }}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !flipped) {
                        e.preventDefault()
                        onFlip()
                    }
                }}
            >
                <div
                    className={`relative transition-transform duration-500 [transform-style:preserve-3d] ${
                        flipped ? '[transform:rotateY(180deg)]' : ''
                    }`}
                >
                    <Card className="[backface-visibility:hidden] min-h-[200px]">
                        <CardContent className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
                            {card.document && (
                                <Badge variant="outline" className="mb-4">
                                    {card.document.title}
                                </Badge>
                            )}
                            <p className="text-xl font-semibold">{card.front}</p>
                            {!flipped && (
                                <p className="text-sm text-muted-foreground mt-6">
                                    Klicken zum Umdrehen
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] min-h-[200px]">
                        <CardContent className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
                            <p className="text-xs text-muted-foreground mb-3 italic">{card.front}</p>
                            <p className="text-lg">{card.back}</p>
                            {card.context && (
                                <p className="text-sm text-muted-foreground mt-4 italic">{card.context}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {flipped && (
                <div className="space-y-3">
                    <p className="text-xs text-center text-muted-foreground">
                        Wie gut konntest du die Antwort?
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                        {FLASHCARD_RATINGS.map((r) => (
                            <Button
                                key={r.quality}
                                variant={r.variant}
                                onClick={() => onRate(r.quality)}
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
    )
}

// ── Quiz sub-component ──

function QuizItem({
    question,
    selectedIndex,
    selectedIndices,
    freeTextAnswer,
    result,
    submitting,
    onSelectIndex,
    onToggleIndex,
    onFreeTextChange,
    onSubmit,
    onNext,
}: {
    question: QuizData
    selectedIndex: number | null
    selectedIndices: number[]
    freeTextAnswer: string
    result: {
        isCorrect: boolean
        correctIndex?: number | null
        correctIndices?: number[]
        explanation?: string
        freeTextScore?: number
        freeTextFeedback?: string
        correctAnswer?: string
    } | null
    submitting: boolean
    onSelectIndex: (i: number | null) => void
    onToggleIndex: (i: number) => void
    onFreeTextChange: (v: string) => void
    onSubmit: () => void
    onNext: () => void
}) {
    const options = question.options as string[] | null
    const type = question.questionType || 'singleChoice'
    const isMulti = type === 'multipleChoice'
    const isFreetext = type === 'freetext'
    const isCloze = type === 'cloze'
    const docTitle = question.quiz?.document?.title || question.quiz?.title

    const canSubmit = isFreetext || isCloze
        ? !!freeTextAnswer.trim()
        : isMulti
            ? selectedIndices.length > 0
            : selectedIndex !== null

    // Split cloze question text around {{blank}}
    const clozeParts = isCloze ? question.questionText.split('{{blank}}') : []

    return (
        <div className="space-y-4">
            <Badge variant="secondary" className="gap-1">
                {isCloze ? <PenLine className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
                {isCloze ? 'Lückentext' : 'Quizfrage'}
            </Badge>

            <Card>
                <CardHeader>
                    {!isCloze && <CardTitle className="text-lg">{question.questionText}</CardTitle>}
                    <div className="flex items-center gap-1.5 mt-1">
                        {docTitle && (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                {docTitle}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Multiple choice */}
                    {isMulti && options && (
                        <div className="space-y-2">
                            {options.map((opt, i) => {
                                const correctSet = result?.correctIndices ?? []
                                const isSelected = selectedIndices.includes(i)
                                let itemClass = ''
                                if (result && correctSet.length > 0) {
                                    if (correctSet.includes(i)) {
                                        itemClass = 'border-green-500 bg-green-50 dark:bg-green-950'
                                    } else if (isSelected) {
                                        itemClass = 'border-red-500 bg-red-50 dark:bg-red-950'
                                    }
                                }
                                return (
                                    <label key={i} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent text-sm ${itemClass}`}>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => { if (!result) onToggleIndex(i) }}
                                            disabled={!!result}
                                        />
                                        {opt}
                                        {result && correctSet.includes(i) && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />}
                                        {result && isSelected && !correctSet.includes(i) && <XCircle className="h-4 w-4 text-red-600 ml-auto" />}
                                    </label>
                                )
                            })}
                        </div>
                    )}

                    {/* Single choice / truefalse */}
                    {!isMulti && !isFreetext && options && (
                        <RadioGroup
                            value={selectedIndex !== null ? String(selectedIndex) : ''}
                            onValueChange={(v) => { if (!result) onSelectIndex(Number(v)) }}
                            disabled={!!result}
                        >
                            {options.map((opt, i) => {
                                let itemClass = ''
                                if (result && result.correctIndex !== null && result.correctIndex !== undefined) {
                                    if (i === result.correctIndex) {
                                        itemClass = 'border-green-500 bg-green-50 dark:bg-green-950'
                                    } else if (i === selectedIndex && !result.isCorrect) {
                                        itemClass = 'border-red-500 bg-red-50 dark:bg-red-950'
                                    }
                                }
                                return (
                                    <label key={i} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent text-sm ${itemClass}`}>
                                        <RadioGroupItem value={String(i)} />
                                        {opt}
                                        {result && result.correctIndex === i && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />}
                                        {result && i === selectedIndex && !result.isCorrect && result.correctIndex !== i && <XCircle className="h-4 w-4 text-red-600 ml-auto" />}
                                    </label>
                                )
                            })}
                        </RadioGroup>
                    )}

                    {/* Cloze */}
                    {isCloze && (
                        <div className="space-y-2">
                            <p className="text-lg leading-relaxed">
                                {clozeParts.map((part, i) => (
                                    <span key={i}>
                                        {part}
                                        {i < clozeParts.length - 1 && (
                                            <input
                                                type="text"
                                                value={freeTextAnswer}
                                                onChange={(e) => { if (!result) onFreeTextChange(e.target.value) }}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !result) onSubmit() }}
                                                disabled={!!result}
                                                autoFocus
                                                className={`inline-block w-40 mx-1 px-2 py-0.5 text-center border-b-2 bg-transparent outline-none text-base ${
                                                    result
                                                        ? result.isCorrect || (result.freeTextScore ?? 0) >= 0.5
                                                            ? 'border-green-500 text-green-700 dark:text-green-400'
                                                            : 'border-red-500 text-red-700 dark:text-red-400'
                                                        : 'border-primary focus:border-primary'
                                                }`}
                                                placeholder="___"
                                                maxLength={100}
                                            />
                                        )}
                                    </span>
                                ))}
                            </p>
                        </div>
                    )}

                    {/* Freetext */}
                    {isFreetext && (
                        <div className="space-y-2">
                            <Textarea
                                value={freeTextAnswer}
                                onChange={(e) => { if (!result) onFreeTextChange(e.target.value) }}
                                disabled={!!result}
                                placeholder="Schreibe deine Antwort hier..."
                                maxLength={2000}
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Result feedback */}
                    {result && (
                        <div className="mt-4 p-3 rounded-lg border bg-muted/50 space-y-2">
                            <div className="flex items-center gap-2">
                                {(isFreetext || isCloze) ? (
                                    <Badge variant="outline">
                                        Bewertung: {Math.round((result.freeTextScore ?? 0) * 100)}%
                                    </Badge>
                                ) : result.isCorrect ? (
                                    <Badge className="bg-green-600">Richtig</Badge>
                                ) : (
                                    <Badge variant="destructive">Falsch</Badge>
                                )}
                            </div>
                            {isCloze && result.correctAnswer && (
                                <p className="text-sm font-medium">
                                    Richtige Antwort: <span className="text-green-600">{result.correctAnswer}</span>
                                </p>
                            )}
                            {result.explanation && (
                                <p className="text-sm text-muted-foreground">{result.explanation}</p>
                            )}
                            {result.freeTextFeedback && (
                                <p className="text-sm text-muted-foreground">{result.freeTextFeedback}</p>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    {!result ? (
                        <Button onClick={onSubmit} disabled={!canSubmit || submitting}>
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            Antwort prüfen
                        </Button>
                    ) : (
                        <Button onClick={onNext}>
                            Weiter
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
