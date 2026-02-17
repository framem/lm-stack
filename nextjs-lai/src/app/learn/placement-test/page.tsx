'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GraduationCap, CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { generatePlacementQuestions, evaluatePlacementResult, type PlacementQuestion } from '@/src/lib/placement-test'
import { setLearningGoal } from '@/src/actions/learning-goal'

type Phase = 'intro' | 'test' | 'result'

const LEVEL_COLORS: Record<string, string> = {
    A1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    A2: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    B1: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
}

export default function PlacementTestPage() {
    const router = useRouter()
    const [phase, setPhase] = useState<Phase>('intro')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([])
    const [saving, setSaving] = useState(false)

    const questions = useMemo(() => generatePlacementQuestions(), [])
    const currentQuestion = questions[currentIndex]
    const progress = ((currentIndex + (showFeedback ? 1 : 0)) / questions.length) * 100

    function handleAnswer() {
        if (selectedIndex === null || !currentQuestion) return
        const isCorrect = selectedIndex === currentQuestion.correctIndex
        setAnswers((prev) => [...prev, { questionId: currentQuestion.id, isCorrect }])
        setShowFeedback(true)
    }

    function handleNext() {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1)
            setSelectedIndex(null)
            setShowFeedback(false)
        } else {
            setPhase('result')
        }
    }

    const result = phase === 'result' ? evaluatePlacementResult(answers, questions) : null

    async function handleSaveLevel() {
        if (!result) return
        setSaving(true)
        try {
            await setLearningGoal({ language: 'de', targetLevel: result.level })
            toast.success(`Lernziel auf ${result.level} gesetzt!`)
            router.push('/learn')
        } catch {
            toast.error('Lernziel konnte nicht gespeichert werden.')
        } finally {
            setSaving(false)
        }
    }

    if (phase === 'intro') {
        return (
            <div className="p-6 max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <GraduationCap className="h-6 w-6" />
                        Einstufungstest Deutsch
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Finde dein aktuelles CEFR-Niveau heraus (A1, A2 oder B1).
                    </p>
                </div>

                <Card>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm">
                            Der Test besteht aus <strong>{questions.length} Fragen</strong> zum
                            deutschen Grundwortschatz. Die Fragen werden nach Schwierigkeit gruppiert:
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge className={LEVEL_COLORS.A1}>A1</Badge>
                                <span className="text-sm">Anfänger — Grundlegende Wörter und Artikel</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className={LEVEL_COLORS.A2}>A2</Badge>
                                <span className="text-sm">Grundkenntnisse — Erweiterter Wortschatz</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className={LEVEL_COLORS.B1}>B1</Badge>
                                <span className="text-sm">Fortgeschritten — Komplexerer Wortschatz</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Basierend auf den offiziellen Goethe-Institut Wortlisten.
                        </p>
                        <Button onClick={() => setPhase('test')} className="w-full" size="lg">
                            Test starten
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (phase === 'result' && result) {
        return (
            <div className="p-6 max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <GraduationCap className="h-6 w-6" />
                        Ergebnis
                    </h1>
                </div>

                <Card>
                    <CardContent className="p-6 space-y-6">
                        <div className="text-center space-y-2">
                            <p className="text-muted-foreground text-sm">Dein eingestuftes Niveau:</p>
                            <div className="inline-flex items-center gap-2">
                                <Badge className={`text-2xl px-4 py-1.5 ${LEVEL_COLORS[result.level]}`}>
                                    {result.level}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {(['A1', 'A2', 'B1'] as const).map((level) => {
                                const s = result.scores[level]
                                return (
                                    <div key={level} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <Badge variant="outline" className="text-xs">{level}</Badge>
                                            <span className="font-medium tabular-nums">
                                                {s.correct}/{s.total} richtig ({s.percentage}%)
                                            </span>
                                        </div>
                                        <Progress value={s.percentage} />
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => { setPhase('intro'); setCurrentIndex(0); setAnswers([]); setSelectedIndex(null); setShowFeedback(false) }}>
                                <RotateCcw className="h-4 w-4" />
                                Wiederholen
                            </Button>
                            <Button onClick={handleSaveLevel} disabled={saving} className="flex-1">
                                {saving ? 'Wird gespeichert…' : `Lernziel auf ${result.level} setzen`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Test phase
    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Badge variant="outline" className={LEVEL_COLORS[currentQuestion?.level ?? 'A1']}>
                    {currentQuestion?.level}
                </Badge>
                <span className="text-sm text-muted-foreground tabular-nums">
                    {currentIndex + 1} / {questions.length}
                </span>
            </div>
            <Progress value={progress} />

            {currentQuestion && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">{currentQuestion.questionText}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <RadioGroup
                            value={selectedIndex !== null ? String(selectedIndex) : ''}
                            onValueChange={(v) => !showFeedback && setSelectedIndex(Number(v))}
                        >
                            {currentQuestion.options.map((option, idx) => {
                                let className = 'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent'
                                if (showFeedback) {
                                    if (idx === currentQuestion.correctIndex) {
                                        className = 'flex items-center gap-3 p-3 rounded-lg border border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                                    } else if (idx === selectedIndex && idx !== currentQuestion.correctIndex) {
                                        className = 'flex items-center gap-3 p-3 rounded-lg border border-destructive bg-destructive/10'
                                    } else {
                                        className = 'flex items-center gap-3 p-3 rounded-lg border opacity-50'
                                    }
                                }

                                return (
                                    <label key={idx} className={className}>
                                        <RadioGroupItem value={String(idx)} disabled={showFeedback} />
                                        <span className="text-sm">{option}</span>
                                        {showFeedback && idx === currentQuestion.correctIndex && (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
                                        )}
                                        {showFeedback && idx === selectedIndex && idx !== currentQuestion.correctIndex && (
                                            <XCircle className="h-4 w-4 text-destructive ml-auto" />
                                        )}
                                    </label>
                                )
                            })}
                        </RadioGroup>

                        {!showFeedback ? (
                            <Button
                                onClick={handleAnswer}
                                disabled={selectedIndex === null}
                                className="w-full"
                            >
                                Antworten
                            </Button>
                        ) : (
                            <Button onClick={handleNext} className="w-full">
                                {currentIndex < questions.length - 1 ? (
                                    <>Weiter <ArrowRight className="h-4 w-4" /></>
                                ) : (
                                    'Ergebnis anzeigen'
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
