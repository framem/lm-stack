'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/src/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Progress } from '@/src/components/ui/progress'
import { Textarea } from '@/src/components/ui/textarea'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/src/components/ai-elements/reasoning'
import { evaluateAnswer } from '@/src/actions/quiz'

interface Question {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    questionType?: string
}

interface AnswerResult {
    isCorrect: boolean
    correctIndex: number | null
    correctIndices?: number[]
    explanation?: string
    reasoning?: string
    freeTextScore?: number
    freeTextFeedback?: string
    correctAnswer?: string
    sourceSnippet?: string
}

interface QuizPlayerProps {
    quizId: string
    quizTitle: string
    questions: Question[]
    onComplete: (results: Map<string, AnswerResult>) => void
}

const TYPE_LABELS: Record<string, string> = {
    singleChoice: 'Single Choice',
    multipleChoice: 'Multiple Choice',
    freetext: 'Freitext',
    truefalse: 'Wahr/Falsch',
}

export function QuizPlayer({ quizTitle, questions, onComplete }: QuizPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [freeTextAnswer, setFreeTextAnswer] = useState('')
    const [result, setResult] = useState<AnswerResult | null>(null)
    const [results, setResults] = useState<Map<string, AnswerResult>>(new Map())
    const [selectedIndices, setSelectedIndices] = useState<number[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [answerHistory, setAnswerHistory] = useState<Map<number, { selectedIndex: number | null; selectedIndices: number[]; freeTextAnswer: string; result: AnswerResult | null }>>(new Map())

    const currentQuestion = questions[currentIndex]
    const isLastQuestion = currentIndex === questions.length - 1
    const progress = ((currentIndex + (result ? 1 : 0)) / questions.length) * 100
    const isFreetext = currentQuestion?.questionType === 'freetext'
    const isMultipleChoice = currentQuestion?.questionType === 'multipleChoice'

    async function handleSubmit() {
        if (!currentQuestion) return
        if (isMultipleChoice && selectedIndices.length === 0) return
        if (!isMultipleChoice && !isFreetext && selectedIndex === null) return
        if (isFreetext && !freeTextAnswer.trim()) return

        setSubmitting(true)

        try {
            const data = await evaluateAnswer(
                currentQuestion.id,
                isFreetext || isMultipleChoice ? null : selectedIndex,
                isFreetext ? freeTextAnswer : undefined,
                isMultipleChoice ? selectedIndices : undefined,
            ) as AnswerResult
            setResult(data)

            const newResults = new Map(results)
            newResults.set(currentQuestion.id, data)
            setResults(newResults)
        } catch (error) {
            console.error('Evaluation error:', error)
        } finally {
            setSubmitting(false)
        }
    }

    function handleNext() {
        // Save current state to history
        setAnswerHistory(prev => {
            const next = new Map(prev)
            next.set(currentIndex, { selectedIndex, selectedIndices, freeTextAnswer, result })
            return next
        })

        if (isLastQuestion) {
            onComplete(results)
            return
        }

        const nextIndex = currentIndex + 1
        const nextState = answerHistory.get(nextIndex)
        setCurrentIndex(nextIndex)
        setSelectedIndex(nextState?.selectedIndex ?? null)
        setSelectedIndices(nextState?.selectedIndices ?? [])
        setFreeTextAnswer(nextState?.freeTextAnswer ?? '')
        setResult(nextState?.result ?? null)
    }

    function handleSkip() {
        // Save current empty state
        setAnswerHistory(prev => {
            const next = new Map(prev)
            next.set(currentIndex, { selectedIndex: null, selectedIndices: [], freeTextAnswer: '', result: null })
            return next
        })

        const skipResult: AnswerResult = {
            isCorrect: false,
            correctIndex: null,
            explanation: 'Frage wurde übersprungen.',
        }
        const newResults = new Map(results)
        newResults.set(currentQuestion.id, skipResult)
        setResults(newResults)

        if (isLastQuestion) {
            onComplete(newResults)
            return
        }
        setCurrentIndex(i => i + 1)
        setSelectedIndex(null)
        setSelectedIndices([])
        setFreeTextAnswer('')
        setResult(null)
    }

    function handleBack() {
        if (currentIndex === 0) return
        // Save current state
        setAnswerHistory(prev => {
            const next = new Map(prev)
            next.set(currentIndex, { selectedIndex, selectedIndices, freeTextAnswer, result })
            return next
        })

        const prevIndex = currentIndex - 1
        const prevState = answerHistory.get(prevIndex)
        setCurrentIndex(prevIndex)
        setSelectedIndex(prevState?.selectedIndex ?? null)
        setSelectedIndices(prevState?.selectedIndices ?? [])
        setFreeTextAnswer(prevState?.freeTextAnswer ?? '')
        setResult(prevState?.result ?? null)
    }

    if (!currentQuestion) return null

    const options = currentQuestion.options
    const canSubmit = isFreetext
        ? !!freeTextAnswer.trim()
        : isMultipleChoice
            ? selectedIndices.length > 0
            : selectedIndex !== null

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{quizTitle}</span>
                </div>
                <Progress value={progress} />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <Link href="/learn/quiz" className="hover:text-foreground transition-colors">
                        &larr; Quiz abbrechen
                    </Link>
                    <span>Frage {currentIndex + 1} von {questions.length}</span>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {currentQuestion.questionText}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 mt-1">
                        {currentQuestion.questionType && (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                {TYPE_LABELS[currentQuestion.questionType] ?? currentQuestion.questionType}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Multi: show Checkboxes */}
                    {isMultipleChoice && options && options.length > 0 && (
                        <div className="space-y-2">
                            {options.map((option, i) => {
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
                                    <label
                                        key={i}
                                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent ${itemClass}`}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => {
                                                if (!result) {
                                                    setSelectedIndices(prev =>
                                                        prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                                                    )
                                                }
                                            }}
                                            disabled={!!result}
                                        />
                                        <span className="text-sm">{option}</span>
                                        {result && correctSet.includes(i) && (
                                            <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                                        )}
                                        {result && isSelected && !correctSet.includes(i) && (
                                            <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                        )}
                                    </label>
                                )
                            })}
                        </div>
                    )}

                    {/* MC / True-False: show RadioGroup */}
                    {!isMultipleChoice && options && options.length > 0 && (
                        <RadioGroup
                            value={selectedIndex !== null ? String(selectedIndex) : ''}
                            onValueChange={(v) => {
                                if (!result) setSelectedIndex(Number(v))
                            }}
                            disabled={!!result}
                        >
                            {options.map((option, i) => {
                                let itemClass = ''
                                if (result && result.correctIndex !== null) {
                                    if (i === result.correctIndex) {
                                        itemClass = 'border-green-500 bg-green-50 dark:bg-green-950'
                                    } else if (i === selectedIndex && !result.isCorrect) {
                                        itemClass = 'border-red-500 bg-red-50 dark:bg-red-950'
                                    }
                                }

                                return (
                                    <label
                                        key={i}
                                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent ${itemClass}`}
                                    >
                                        <RadioGroupItem value={String(i)} />
                                        <span className="text-sm">{option}</span>
                                        {result && result.correctIndex !== null && i === result.correctIndex && (
                                            <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                                        )}
                                        {result && i === selectedIndex && !result.isCorrect && result.correctIndex !== null && i !== result.correctIndex && (
                                            <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                        )}
                                    </label>
                                )
                            })}
                        </RadioGroup>
                    )}

                    {/* Freetext: show only Textarea */}
                    {isFreetext && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Deine Antwort:
                            </label>
                            <Textarea
                                value={freeTextAnswer}
                                onChange={(e) => {
                                    if (!result) setFreeTextAnswer(e.target.value)
                                }}
                                disabled={!!result}
                                placeholder="Schreibe deine Antwort hier..."
                                maxLength={2000}
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {freeTextAnswer.length}/2000
                            </p>
                        </div>
                    )}

                    {result && (
                        <div className="mt-4 p-4 rounded-lg border bg-muted/50 space-y-3">
                            <div className="flex items-center gap-2">
                                {isFreetext ? (
                                    <Badge variant="outline">
                                        Bewertung: {Math.round((result.freeTextScore ?? 0) * 100)}%
                                    </Badge>
                                ) : result.isCorrect ? (
                                    <Badge className="bg-green-600">Richtig</Badge>
                                ) : (
                                    <Badge variant="destructive">Falsch</Badge>
                                )}
                            </div>
                            {result.reasoning && (
                                <Reasoning defaultOpen={false}>
                                    <ReasoningTrigger getThinkingMessage={() => (
                                        <p>Überlegungen des Modells</p>
                                    )} />
                                    <ReasoningContent>{result.reasoning}</ReasoningContent>
                                </Reasoning>
                            )}
                            {result.explanation && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {result.explanation}
                                </p>
                            )}
                            {result.freeTextFeedback && (
                                <div className="pt-2 border-t">
                                    <p className="text-sm font-medium mb-1">Feedback:</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {result.freeTextFeedback}
                                    </p>
                                </div>
                            )}
                            {result.sourceSnippet && (
                                <div className="pt-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Quelle:</p>
                                    <p className="text-xs text-muted-foreground italic line-clamp-4">
                                        &ldquo;{result.sourceSnippet}&rdquo;
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Back button — only when not on first question and no result yet */}
                        {currentIndex > 0 && !result && (
                            <Button variant="outline" onClick={handleBack}>
                                Zurück
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!result ? (
                            <>
                                <Button variant="ghost" onClick={handleSkip}>
                                    Überspringen
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || submitting}
                                >
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Antwort prüfen
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleNext}>
                                {isLastQuestion ? 'Ergebnisse anzeigen' : 'Nächste Frage'}
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
