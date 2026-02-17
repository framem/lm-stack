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
    MessageSquare,
    Zap,
    Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { getDailyPracticeItems } from '@/src/actions/session'
import { reviewFlashcard } from '@/src/actions/flashcards'
import { evaluateAnswer } from '@/src/actions/quiz'

interface FlashcardData {
    id: string
    front: string
    back: string
    context?: string | null
    document?: { id: string; title: string } | null
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

// Random conversation scenarios to suggest
const CONVERSATION_SUGGESTIONS = [
    { key: 'cafe', icon: '\u2615', label: 'Im Caf\u00e9', level: 'A1' },
    { key: 'supermarkt', icon: '\u{1F6D2}', label: 'Im Supermarkt', level: 'A1-A2' },
    { key: 'wegbeschreibung', icon: '\u{1F5FA}\uFE0F', label: 'Wegbeschreibung', level: 'A2' },
    { key: 'restaurant', icon: '\u{1F37D}\uFE0F', label: 'Im Restaurant', level: 'A2' },
]

export default function DailyPracticePage() {
    const [items, setItems] = useState<SessionItem[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [score, setScore] = useState({ correct: 0, total: 0 })

    // Flashcard state
    const [flipped, setFlipped] = useState(false)

    // Quiz state
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [quizResult, setQuizResult] = useState<{
        isCorrect: boolean
        correctIndex?: number | null
        explanation?: string
    } | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const data = await getDailyPracticeItems()
                setItems(data as unknown as SessionItem[])
            } catch (err) {
                console.error('Failed to load daily items:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const currentItem = items[currentIndex]
    const progressPercent = items.length > 0 ? ((currentIndex + (completed ? 1 : 0)) / items.length) * 100 : 0

    const resetState = useCallback(() => {
        setFlipped(false)
        setSelectedIndex(null)
        setQuizResult(null)
    }, [])

    function advance() {
        if (currentIndex >= items.length - 1) {
            setCompleted(true)
            return
        }
        setCurrentIndex((i) => i + 1)
        resetState()
    }

    async function handleFlashcardRate(quality: number) {
        if (!currentItem || submitting) return
        setSubmitting(true)
        try {
            await reviewFlashcard(currentItem.id, quality)
            setScore((s) => ({
                correct: s.correct + (quality >= 4 ? 1 : 0),
                total: s.total + 1,
            }))
            advance()
        } finally {
            setSubmitting(false)
        }
    }

    async function handleQuizSubmit() {
        if (!currentItem || submitting || selectedIndex === null) return
        setSubmitting(true)
        try {
            const result = await evaluateAnswer(currentItem.id, selectedIndex) as typeof quizResult
            setQuizResult(result)
            setScore((s) => ({
                correct: s.correct + (result?.isCorrect ? 1 : 0),
                total: s.total + 1,
            }))
        } finally {
            setSubmitting(false)
        }
    }

    // Pick a random conversation suggestion
    const suggestion = CONVERSATION_SUGGESTIONS[Math.floor(Date.now() / 86400000) % CONVERSATION_SUGGESTIONS.length]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center space-y-6 mt-16">
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Alles erledigt!</h1>
                    <p className="text-muted-foreground mt-2">
                        Heute sind keine Wiederholungen fällig. Wie wäre es mit einer Konversationsübung?
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button asChild>
                        <Link href={`/learn/conversation?scenario=${suggestion.key}`}>
                            <MessageSquare className="h-4 w-4" />
                            {suggestion.icon} {suggestion.label} üben
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/learn">
                            Zurück zum Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    if (completed) {
        return (
            <div className="p-6 max-w-2xl mx-auto space-y-8 mt-8">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                            <Zap className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">Tägliche Übung geschafft!</h1>
                    <p className="text-muted-foreground">
                        {score.correct} von {score.total} richtig — weiter so!
                    </p>
                </div>

                {/* Conversation prompt */}
                <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-background">
                    <CardContent className="p-6 space-y-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Konversation des Tages</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Übe eine kurze Konversation, um dein Sprechen zu verbessern.
                        </p>
                        <Button asChild>
                            <Link href={`/learn/conversation?scenario=${suggestion.key}`}>
                                {suggestion.icon} {suggestion.label}
                                <Badge variant="secondary" className="ml-2 text-xs">{suggestion.level}</Badge>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex justify-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/learn/session">
                            Volle Lern-Session starten
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href="/learn">
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-lg font-bold">5-Minuten-Übung</h1>
                    <p className="text-sm text-muted-foreground">
                        {items.length} Aufgabe{items.length !== 1 ? 'n' : ''} für heute
                    </p>
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-1">
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                    {currentIndex + 1} / {items.length}
                </p>
            </div>

            {/* Current item */}
            {currentItem.type === 'flashcard' ? (
                <div className="space-y-4">
                    <Badge variant="secondary" className="gap-1">
                        <Layers className="h-3 w-3" />
                        Vokabel
                    </Badge>

                    <div
                        className="perspective-1000 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={flipped ? 'Karteikarte — Antwortseite' : 'Karteikarte umdrehen'}
                        onClick={() => { if (!flipped) setFlipped(true) }}
                        onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && !flipped) {
                                e.preventDefault()
                                setFlipped(true)
                            }
                        }}
                    >
                        <div className={`relative transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
                            <Card className="[backface-visibility:hidden] min-h-[180px]">
                                <CardContent className="flex flex-col items-center justify-center min-h-[180px] p-8 text-center">
                                    <p className="text-xl font-semibold">{(currentItem.data as FlashcardData).front}</p>
                                    {!flipped && (
                                        <p className="text-sm text-muted-foreground mt-4">Klicken zum Umdrehen</p>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] min-h-[180px]">
                                <CardContent className="flex flex-col items-center justify-center min-h-[180px] p-8 text-center">
                                    <p className="text-xs text-muted-foreground mb-2 italic">{(currentItem.data as FlashcardData).front}</p>
                                    <p className="text-lg">{(currentItem.data as FlashcardData).back}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {flipped && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            {FLASHCARD_RATINGS.map((r) => (
                                <Button
                                    key={r.quality}
                                    variant={r.variant}
                                    onClick={() => handleFlashcardRate(r.quality)}
                                    disabled={submitting}
                                    className="w-full sm:w-auto sm:min-w-[130px]"
                                >
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {r.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <Badge variant="secondary" className="gap-1">
                        <HelpCircle className="h-3 w-3" />
                        Quizfrage
                    </Badge>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{(currentItem.data as QuizData).questionText}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Array.isArray((currentItem.data as QuizData).options) && (
                                <RadioGroup
                                    value={selectedIndex !== null ? String(selectedIndex) : ''}
                                    onValueChange={(v) => { if (!quizResult) setSelectedIndex(Number(v)) }}
                                    disabled={!!quizResult}
                                >
                                    {((currentItem.data as QuizData).options as string[]).map((opt, i) => {
                                        let itemClass = ''
                                        if (quizResult && quizResult.correctIndex !== null && quizResult.correctIndex !== undefined) {
                                            if (i === quizResult.correctIndex) {
                                                itemClass = 'border-green-500 bg-green-50 dark:bg-green-950'
                                            } else if (i === selectedIndex && !quizResult.isCorrect) {
                                                itemClass = 'border-red-500 bg-red-50 dark:bg-red-950'
                                            }
                                        }
                                        return (
                                            <label key={i} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent text-sm ${itemClass}`}>
                                                <RadioGroupItem value={String(i)} />
                                                {opt}
                                                {quizResult && quizResult.correctIndex === i && <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />}
                                                {quizResult && i === selectedIndex && !quizResult.isCorrect && quizResult.correctIndex !== i && <XCircle className="h-4 w-4 text-red-600 ml-auto" />}
                                            </label>
                                        )
                                    })}
                                </RadioGroup>
                            )}

                            {quizResult && quizResult.explanation && (
                                <p className="text-sm text-muted-foreground mt-4 p-3 rounded-lg bg-muted/50">
                                    {quizResult.explanation}
                                </p>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            {!quizResult ? (
                                <Button onClick={handleQuizSubmit} disabled={selectedIndex === null || submitting}>
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Antwort prüfen
                                </Button>
                            ) : (
                                <Button onClick={advance}>
                                    Weiter <ArrowRight className="h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    )
}
