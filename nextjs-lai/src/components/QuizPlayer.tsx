'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/src/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
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
    explanation?: string
    reasoning?: string
    freeTextScore?: number
    freeTextFeedback?: string
    correctAnswer?: string
}

interface QuizPlayerProps {
    quizId: string
    quizTitle: string
    questions: Question[]
    onComplete: (results: Map<string, AnswerResult>) => void
}

const TYPE_LABELS: Record<string, string> = {
    mc: 'Multiple Choice',
    freetext: 'Freitext',
    truefalse: 'Wahr/Falsch',
}

export function QuizPlayer({ quizId, quizTitle, questions, onComplete }: QuizPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [freeTextAnswer, setFreeTextAnswer] = useState('')
    const [result, setResult] = useState<AnswerResult | null>(null)
    const [results, setResults] = useState<Map<string, AnswerResult>>(new Map())
    const [submitting, setSubmitting] = useState(false)

    const currentQuestion = questions[currentIndex]
    const isLastQuestion = currentIndex === questions.length - 1
    const progress = ((currentIndex + (result ? 1 : 0)) / questions.length) * 100
    const isFreetext = currentQuestion?.questionType === 'freetext'

    async function handleSubmit() {
        if (!currentQuestion) return
        if (!isFreetext && selectedIndex === null) return
        if (isFreetext && !freeTextAnswer.trim()) return

        setSubmitting(true)

        try {
            const data = await evaluateAnswer(
                currentQuestion.id,
                isFreetext ? null : selectedIndex,
                isFreetext ? freeTextAnswer : undefined,
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
        if (isLastQuestion) {
            onComplete(results)
            return
        }
        setCurrentIndex((i) => i + 1)
        setSelectedIndex(null)
        setFreeTextAnswer('')
        setResult(null)
    }

    if (!currentQuestion) return null

    const options = currentQuestion.options
    const canSubmit = isFreetext
        ? !!freeTextAnswer.trim()
        : selectedIndex !== null

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{quizTitle}</span>
                    <span>Frage {currentIndex + 1} von {questions.length}</span>
                </div>
                <Progress value={progress} />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                            {currentQuestion.questionText}
                        </CardTitle>
                        {currentQuestion.questionType && (
                            <Badge variant="outline" className="shrink-0">
                                {TYPE_LABELS[currentQuestion.questionType] ?? currentQuestion.questionType}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {/* MC / True-False: show RadioGroup */}
                    {options && options.length > 0 && (
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
                        </div>
                    )}
                </CardContent>
                <CardFooter className="gap-2">
                    {!result ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={!canSubmit || submitting}
                        >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            Antwort prüfen
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>
                            {isLastQuestion ? 'Ergebnisse anzeigen' : 'Nächste Frage'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
