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
    Flame,
    GraduationCap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { getDailyPracticeItems } from '@/src/actions/session'
import { getUserStats } from '@/src/actions/user-stats'
import { reviewFlashcard } from '@/src/actions/flashcards'
import { evaluateAnswer } from '@/src/actions/quiz'
import { TTSButton } from '@/src/components/TTSButton'
import { detectLanguageFromSubject, extractCEFRLevel, compareCEFRLevels } from '@/src/lib/language-utils'

interface FlashcardData {
    id: string
    front: string
    back: string
    context?: string | null
    document?: { id: string; title: string; subject?: string | null } | null
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
    const [streak, setStreak] = useState<number>(0)
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
                const [data, stats] = await Promise.all([
                    getDailyPracticeItems(),
                    getUserStats(),
                ])
                setItems(data as unknown as SessionItem[])
                setStreak(stats.currentStreak ?? 0)
            } catch (err) {
                console.error('Failed to load daily items:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const currentItem = items[currentIndex]
    const progressPercent = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0

    const flashcardCount = items.filter(i => i.type === 'flashcard').length
    const quizCount = items.filter(i => i.type === 'quiz').length

    function getDailySubtitle(count: number): string {
        if (streak > 1) return `Tag ${streak} — Streak halten mit ${count} ${count === 1 ? 'Aufgabe' : 'Aufgaben'}!`
        if (count <= 3) return 'Schnelle Runde — gleich geschafft!'
        if (count <= 6) return `${count} Aufgaben für heute`
        return `${count} Aufgaben — du schaffst das!`
    }

    // Detect language and CEFR level from flashcard subjects
    const { detectedLang, userLevel } = (() => {
        let lang = 'de'
        let maxLevel: string | null = null

        for (const item of items) {
            if (item.type === 'flashcard' && 'document' in item.data) {
                const subject = (item.data as FlashcardData).document?.subject

                // Detect language
                const ttsLang = detectLanguageFromSubject(subject)
                if (ttsLang.startsWith('es')) lang = 'es'
                else if (ttsLang.startsWith('en')) lang = 'en'
                else if (ttsLang.startsWith('fr')) lang = 'fr'
                else if (ttsLang.startsWith('it')) lang = 'it'

                // Extract CEFR level
                const level = extractCEFRLevel(subject)
                if (level) {
                    if (!maxLevel || compareCEFRLevels(level, maxLevel)) {
                        maxLevel = level
                    }
                }
            }
        }

        return { detectedLang: lang, userLevel: maxLevel || 'A1' }
    })()

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

    // Filter conversation suggestions by user's CEFR level
    const suitableScenarios = CONVERSATION_SUGGESTIONS.filter((scenario) => {
        // Extract highest level from difficulty string (e.g., "A1-A2" → "A2")
        const levels = scenario.level.match(/[ABC][12]/g)
        if (!levels) return true // If no level specified, show it

        const scenarioMaxLevel = levels[levels.length - 1] // Take highest level
        return compareCEFRLevels(userLevel, scenarioMaxLevel)
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="p-6 max-w-3xl mx-auto text-center space-y-6 mt-16">
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
                <div className="flex flex-col gap-3 max-w-md mx-auto">
                    <p className="text-sm text-muted-foreground text-center mb-2">
                        Wähle ein Szenario zum Üben:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {suitableScenarios.map((scenario) => (
                            <Button key={scenario.key} variant="outline" asChild className="h-auto py-3">
                                <Link href={`/learn/conversation?scenario=${scenario.key}&language=${detectedLang}`}>
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-2xl">{scenario.icon}</span>
                                        <span className="text-sm font-medium">{scenario.label}</span>
                                        <Badge variant="secondary" className="text-xs">{scenario.level}</Badge>
                                    </div>
                                </Link>
                            </Button>
                        ))}
                    </div>
                    <Button variant="ghost" asChild className="mt-2">
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
            <div className="p-6 max-w-3xl mx-auto space-y-8 mt-8">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">Tagesübung geschafft!</h1>
                    <p className="text-muted-foreground">
                        {score.correct} von {score.total} richtig — {(() => {
                            const percentage = (score.correct / score.total) * 100
                            if (percentage >= 90) return 'ausgezeichnet!'
                            if (percentage >= 75) return 'sehr gut!'
                            if (percentage >= 60) return 'weiter so!'
                            if (percentage >= 50) return 'weiter üben!'
                            return 'bleib dran!'
                        })()}
                    </p>
                    {streak > 0 && (
                        <div className="flex items-center justify-center gap-2 text-orange-500 font-semibold">
                            <Flame className="h-5 w-5" />
                            {streak === 1
                                ? 'Tag 1 — der Streak beginnt!'
                                : `${streak} Tage in Folge — weiter so!`}
                        </div>
                    )}
                </div>

                {/* Conversation prompt */}
                <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-background">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">Konversation</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Übe eine kurze Konversation, um dein Sprechen zu verbessern.
                        </p>
                            <div className="grid grid-cols-2 gap-2">
                            {suitableScenarios.map((scenario) => (
                                <Button key={scenario.key} variant="outline" asChild size="sm" className="h-auto py-2">
                                    <Link href={`/learn/conversation?scenario=${scenario.key}&language=${detectedLang}`}>
                                        <div className="flex flex-col items-center gap-1 w-full">
                                            <div className="flex items-center gap-1">
                                                <span>{scenario.icon}</span>
                                                <span className="text-sm truncate">{scenario.label}</span>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">{scenario.level}</Badge>
                                        </div>
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col items-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/learn/session">
                            <GraduationCap className="h-4 w-4" />
                            Lern-Session — alle fälligen Items
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
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">Tagesübung</h1>
                    <p className="text-sm text-muted-foreground">
                        {getDailySubtitle(items.length)}
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    {flashcardCount > 0 && (
                        <Badge variant="secondary" className="gap-1">
                            <Layers className="h-3 w-3" />
                            {flashcardCount}
                        </Badge>
                    )}
                    {quizCount > 0 && (
                        <Badge variant="secondary" className="gap-1">
                            <HelpCircle className="h-3 w-3" />
                            {quizCount}
                        </Badge>
                    )}
                    {streak > 0 && (
                        <Badge variant="outline" className="gap-1 border-orange-500/50 text-orange-600 dark:text-orange-400">
                            <Flame className="h-3 w-3" />
                            {streak}
                        </Badge>
                    )}
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
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-semibold">{(currentItem.data as FlashcardData).front}</p>
                                        <TTSButton
                                            text={(currentItem.data as FlashcardData).front}
                                            lang={detectLanguageFromSubject((currentItem.data as FlashcardData).document?.subject)}
                                        />
                                    </div>
                                    {!flipped && (
                                        <p className="text-sm text-muted-foreground mt-4">Klicken zum Umdrehen</p>
                                    )}
                                </CardContent>
                            </Card>
                            <Card className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] min-h-[180px]">
                                <CardContent className="flex flex-col items-center justify-center min-h-[180px] p-8 text-center">
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="text-xs text-muted-foreground italic">{(currentItem.data as FlashcardData).front}</p>
                                        <TTSButton
                                            text={(currentItem.data as FlashcardData).front}
                                            lang={detectLanguageFromSubject((currentItem.data as FlashcardData).document?.subject)}
                                            size="sm"
                                        />
                                    </div>
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
