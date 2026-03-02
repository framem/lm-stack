'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Check, X, RotateCcw, Languages, AlignLeft } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Input } from '@/src/components/ui/input'
import { ConjugationTable } from '@/src/components/ConjugationTable'
import { useLearningSession } from '@/src/hooks/use-learning-session'
import type { LanguageInfo } from '@/src/lib/language-utils'
import {
    getConjugationExercises,
    getDeclensionExercises,
    getSentenceStructureExercises,
    type ConjugationExercise,
    type DeclensionExercise,
    type SentenceStructureExercise,
} from './grammar-exercises'
import { shuffle } from '@/src/lib/utils'

// ── Conjugation Drill ──────────────────────────────────────────────────

function ConjugationDrill({ exercises }: { exercises: ConjugationExercise[] }) {
    const shuffled = useMemo(() => shuffle(exercises), [exercises])
    const [current, setCurrent] = useState(0)
    const [answer, setAnswer] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)
    const [finished, setFinished] = useState(false)

    const exercise = shuffled[current]
    const total = shuffled.length
    const isCorrect = submitted && answer.trim().toLowerCase() === exercise?.correct.toLowerCase()

    const handleSubmit = useCallback(() => {
        if (!answer.trim() || submitted) return
        setSubmitted(true)
        if (answer.trim().toLowerCase() === exercise.correct.toLowerCase()) {
            setScore(s => s + 1)
        }
    }, [answer, submitted, exercise])

    const handleNext = useCallback(() => {
        if (current + 1 >= total) {
            setFinished(true)
        } else {
            setCurrent(c => c + 1)
            setAnswer('')
            setSubmitted(false)
        }
    }, [current, total])

    const handleRestart = useCallback(() => {
        setCurrent(0)
        setAnswer('')
        setSubmitted(false)
        setScore(0)
        setFinished(false)
    }, [])

    // Submit on Enter key
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (submitted) handleNext()
            else handleSubmit()
        }
    }, [submitted, handleNext, handleSubmit])

    if (exercises.length === 0) {
        return (
            <Card>
                <CardContent>
                    <p className="text-muted-foreground py-4">
                        Keine Konjugationsübungen für diese Sprache verfügbar.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (finished) {
        return (
            <SummaryCard
                score={score}
                total={total}
                label="Konjugation"
                onRestart={handleRestart}
            />
        )
    }

    return (
        <div className="space-y-4">
            <DrillHeader current={current} total={total} score={score} />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Languages className="h-5 w-5 text-primary" />
                        Konjugiere das Verb
                    </CardTitle>
                    <CardDescription>
                        <span className="font-semibold">{exercise.verb}</span>
                        {' — '}
                        <Badge variant="outline">{exercise.tense}</Badge>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg">
                        <span className="font-medium">{exercise.pronoun}</span>{' '}
                        <span className="text-muted-foreground">___</span>
                    </p>

                    <div className="flex gap-2">
                        <Input
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Antwort eingeben..."
                            disabled={submitted}
                            autoFocus
                            className={submitted
                                ? isCorrect
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                    : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                : ''
                            }
                        />
                        {!submitted && (
                            <Button onClick={handleSubmit} disabled={!answer.trim()}>
                                Prüfen
                            </Button>
                        )}
                    </div>

                    {submitted && (
                        <div className="space-y-3">
                            <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {isCorrect
                                    ? <><Check className="h-4 w-4" /> Richtig!</>
                                    : <><X className="h-4 w-4" /> Falsch — die richtige Antwort ist: <span className="font-bold">{exercise.correct}</span></>
                                }
                            </div>

                            {exercise.fullTable && (
                                <ConjugationTable conjugation={exercise.fullTable} />
                            )}

                            <Button onClick={handleNext}>
                                {current + 1 >= total ? 'Ergebnis anzeigen' : 'Nächste Übung'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// ── Declension Drill ───────────────────────────────────────────────────

function DeclensionDrill({ exercises }: { exercises: DeclensionExercise[] }) {
    const shuffled = useMemo(() => shuffle(exercises), [exercises])
    const [current, setCurrent] = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)
    const [finished, setFinished] = useState(false)

    const exercise = shuffled[current]
    const total = shuffled.length
    const isCorrect = submitted && selected === exercise?.correctIndex

    const handleSubmit = useCallback(() => {
        if (selected === null || submitted) return
        setSubmitted(true)
        if (selected === exercise.correctIndex) {
            setScore(s => s + 1)
        }
    }, [selected, submitted, exercise])

    const handleNext = useCallback(() => {
        if (current + 1 >= total) {
            setFinished(true)
        } else {
            setCurrent(c => c + 1)
            setSelected(null)
            setSubmitted(false)
        }
    }, [current, total])

    const handleRestart = useCallback(() => {
        setCurrent(0)
        setSelected(null)
        setSubmitted(false)
        setScore(0)
        setFinished(false)
    }, [])

    if (exercises.length === 0) {
        return (
            <Card>
                <CardContent>
                    <p className="text-muted-foreground py-4">
                        Keine Deklinationsübungen für diese Sprache verfügbar.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (finished) {
        return (
            <SummaryCard
                score={score}
                total={total}
                label="Deklinationen"
                onRestart={handleRestart}
            />
        )
    }

    return (
        <div className="space-y-4">
            <DrillHeader current={current} total={total} score={score} />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Wähle die richtige Form
                    </CardTitle>
                    <CardDescription>
                        <Badge variant="outline">{exercise.case}</Badge>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg">{exercise.sentence}</p>

                    <div className="grid grid-cols-2 gap-2">
                        {exercise.options.map((option, idx) => {
                            let variant: 'outline' | 'default' | 'destructive' = 'outline'
                            if (submitted) {
                                if (idx === exercise.correctIndex) variant = 'default'
                                else if (idx === selected) variant = 'destructive'
                            }

                            return (
                                <Button
                                    key={idx}
                                    variant={variant}
                                    className={`justify-start ${!submitted && selected === idx ? 'ring-2 ring-primary' : ''}`}
                                    onClick={() => {
                                        if (!submitted) setSelected(idx)
                                    }}
                                    disabled={submitted}
                                >
                                    {option}
                                </Button>
                            )
                        })}
                    </div>

                    {!submitted && (
                        <Button onClick={handleSubmit} disabled={selected === null}>
                            Prüfen
                        </Button>
                    )}

                    {submitted && (
                        <div className="space-y-3">
                            <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {isCorrect
                                    ? <><Check className="h-4 w-4" /> Richtig!</>
                                    : <><X className="h-4 w-4" /> Falsch!</>
                                }
                            </div>
                            <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
                            <Button onClick={handleNext}>
                                {current + 1 >= total ? 'Ergebnis anzeigen' : 'Nächste Übung'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// ── Sentence Structure Drill ───────────────────────────────────────────

function SentenceStructureDrill({ exercises }: { exercises: SentenceStructureExercise[] }) {
    const shuffled = useMemo(() => shuffle(exercises), [exercises])
    const [current, setCurrent] = useState(0)
    const [selectedWords, setSelectedWords] = useState<string[]>([])
    const [remainingWords, setRemainingWords] = useState<string[]>([])
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)
    const [finished, setFinished] = useState(false)

    const exercise = shuffled[current]
    const total = shuffled.length

    // Initialize remaining words when exercise changes
    useEffect(() => {
        if (exercise) {
            setRemainingWords(shuffle(exercise.scrambled))
            setSelectedWords([])
            setSubmitted(false)
        }
    }, [exercise])

    const userSentence = selectedWords.join(' ')
    // Normalize punctuation for comparison
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().replace(/\s([.,!?])/g, '$1')
    const isCorrect = submitted && normalize(userSentence) === normalize(exercise?.correct ?? '')

    const handleWordClick = useCallback((word: string, idx: number) => {
        if (submitted) return
        setSelectedWords(prev => [...prev, word])
        setRemainingWords(prev => {
            const copy = [...prev]
            copy.splice(idx, 1)
            return copy
        })
    }, [submitted])

    const handleRemoveWord = useCallback((idx: number) => {
        if (submitted) return
        const word = selectedWords[idx]
        setSelectedWords(prev => {
            const copy = [...prev]
            copy.splice(idx, 1)
            return copy
        })
        setRemainingWords(prev => [...prev, word])
    }, [submitted, selectedWords])

    const handleSubmit = useCallback(() => {
        if (selectedWords.length === 0 || submitted) return
        setSubmitted(true)
        if (normalize(selectedWords.join(' ')) === normalize(exercise.correct)) {
            setScore(s => s + 1)
        }
    }, [selectedWords, submitted, exercise])

    const handleNext = useCallback(() => {
        if (current + 1 >= total) {
            setFinished(true)
        } else {
            setCurrent(c => c + 1)
        }
    }, [current, total])

    const handleRestart = useCallback(() => {
        setCurrent(0)
        setScore(0)
        setFinished(false)
    }, [])

    if (exercises.length === 0) {
        return (
            <Card>
                <CardContent>
                    <p className="text-muted-foreground py-4">
                        Keine Satzbau-Übungen für diese Sprache verfügbar.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (finished) {
        return (
            <SummaryCard
                score={score}
                total={total}
                label="Satzbau"
                onRestart={handleRestart}
            />
        )
    }

    return (
        <div className="space-y-4">
            <DrillHeader current={current} total={total} score={score} />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlignLeft className="h-5 w-5 text-primary" />
                        Ordne die Wörter richtig
                    </CardTitle>
                    <CardDescription>{exercise.translation}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Selected words area */}
                    <div className="min-h-[3rem] rounded-md border-2 border-dashed p-3 flex flex-wrap gap-2">
                        {selectedWords.length === 0 && (
                            <span className="text-muted-foreground text-sm">
                                Klicke auf die Wörter, um den Satz zu bilden...
                            </span>
                        )}
                        {selectedWords.map((word, idx) => (
                            <Badge
                                key={`sel-${idx}`}
                                variant="default"
                                className={`cursor-pointer text-sm py-1 px-3 ${submitted ? '' : 'hover:bg-primary/80'}`}
                                onClick={() => handleRemoveWord(idx)}
                            >
                                {word}
                            </Badge>
                        ))}
                    </div>

                    {/* Remaining words */}
                    <div className="flex flex-wrap gap-2">
                        {remainingWords.map((word, idx) => (
                            <Badge
                                key={`rem-${idx}`}
                                variant="outline"
                                className="cursor-pointer text-sm py-1 px-3 hover:bg-accent"
                                onClick={() => handleWordClick(word, idx)}
                            >
                                {word}
                            </Badge>
                        ))}
                    </div>

                    {!submitted && (
                        <Button
                            onClick={handleSubmit}
                            disabled={remainingWords.length > 0}
                        >
                            Prüfen
                        </Button>
                    )}

                    {submitted && (
                        <div className="space-y-3">
                            <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {isCorrect
                                    ? <><Check className="h-4 w-4" /> Richtig!</>
                                    : <><X className="h-4 w-4" /> Falsch — richtige Reihenfolge: <span className="font-bold">{exercise.correct}</span></>
                                }
                            </div>
                            <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Regel:</span> {exercise.rule}
                            </p>
                            <Button onClick={handleNext}>
                                {current + 1 >= total ? 'Ergebnis anzeigen' : 'Nächste Übung'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// ── Shared Components ──────────────────────────────────────────────────

function DrillHeader({ current, total, score }: { current: number; total: number; score: number }) {
    const progress = total > 0 ? ((current) / total) * 100 : 0

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Übung {current + 1} von {total}</span>
                <span>Punkte: {score} / {total}</span>
            </div>
            <Progress value={progress} />
        </div>
    )
}

function SummaryCard({
    score,
    total,
    label,
    onRestart,
}: {
    score: number
    total: number
    label: string
    onRestart: () => void
}) {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0
    const getMessage = () => {
        if (percentage === 100) return 'Perfekt! Alle richtig!'
        if (percentage >= 80) return 'Großartig! Sehr gut gemacht!'
        if (percentage >= 60) return 'Gut gemacht! Weiter so!'
        if (percentage >= 40) return 'Nicht schlecht. Übe weiter!'
        return 'Weiter üben — du schaffst das!'
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ergebnis: {label}</CardTitle>
                <CardDescription>{getMessage()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                    <p className="text-4xl font-bold">{score} / {total}</p>
                    <p className="text-muted-foreground">{percentage}% richtig</p>
                    <Progress value={percentage} className="h-3" />
                </div>
                <Button onClick={onRestart} variant="outline" className="w-full gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Nochmal üben
                </Button>
            </CardContent>
        </Card>
    )
}

// ── Main GrammarContent Component ──────────────────────────────────────

interface GrammarContentProps {
    language: LanguageInfo
}

export function GrammarContent({ language }: GrammarContentProps) {
    useLearningSession('grammar')

    const conjugationEx = useMemo(() => getConjugationExercises(language.code), [language.code])
    const declensionEx = useMemo(() => getDeclensionExercises(language.code), [language.code])
    const sentenceEx = useMemo(() => getSentenceStructureExercises(language.code), [language.code])

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/learn/language/${language.code}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold">Grammatik-Drills — {language.name}</h1>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="conjugation">
                <TabsList>
                    <TabsTrigger value="conjugation">
                        <Languages className="h-4 w-4 mr-1" />
                        Konjugation
                    </TabsTrigger>
                    <TabsTrigger value="declension">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Deklinationen
                    </TabsTrigger>
                    <TabsTrigger value="sentence">
                        <AlignLeft className="h-4 w-4 mr-1" />
                        Satzbau
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="conjugation">
                    <ConjugationDrill exercises={conjugationEx} />
                </TabsContent>
                <TabsContent value="declension">
                    <DeclensionDrill exercises={declensionEx} />
                </TabsContent>
                <TabsContent value="sentence">
                    <SentenceStructureDrill exercises={sentenceEx} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
