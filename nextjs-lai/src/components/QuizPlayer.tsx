'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/src/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface Question {
    id: string
    questionText: string
    options: string[]
    questionIndex: number
}

interface AnswerResult {
    isCorrect: boolean
    correctIndex: number
    explanation?: string
}

interface QuizPlayerProps {
    quizId: string
    quizTitle: string
    questions: Question[]
    onComplete: (results: Map<string, AnswerResult>) => void
}

export function QuizPlayer({ quizId, quizTitle, questions, onComplete }: QuizPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [result, setResult] = useState<AnswerResult | null>(null)
    const [results, setResults] = useState<Map<string, AnswerResult>>(new Map())
    const [submitting, setSubmitting] = useState(false)

    const currentQuestion = questions[currentIndex]
    const isLastQuestion = currentIndex === questions.length - 1
    const progress = ((currentIndex + (result ? 1 : 0)) / questions.length) * 100

    async function handleSubmit() {
        if (selectedIndex === null || !currentQuestion) return
        setSubmitting(true)

        try {
            const response = await fetch('/api/quiz/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: currentQuestion.id,
                    selectedIndex,
                }),
            })

            if (!response.ok) {
                throw new Error('Auswertung fehlgeschlagen')
            }

            const data: AnswerResult = await response.json()
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
        setResult(null)
    }

    if (!currentQuestion) return null

    const options = currentQuestion.options as string[]

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
                    <CardTitle className="text-lg">
                        {currentQuestion.questionText}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={selectedIndex !== null ? String(selectedIndex) : undefined}
                        onValueChange={(v) => {
                            if (!result) setSelectedIndex(Number(v))
                        }}
                        disabled={!!result}
                    >
                        {options.map((option, i) => {
                            let itemClass = ''
                            if (result) {
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
                                    {result && i === result.correctIndex && (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                                    )}
                                    {result && i === selectedIndex && !result.isCorrect && i !== result.correctIndex && (
                                        <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                    )}
                                </label>
                            )
                        })}
                    </RadioGroup>

                    {result && (
                        <div className="mt-4 p-4 rounded-lg border bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                                {result.isCorrect ? (
                                    <Badge className="bg-green-600">Richtig</Badge>
                                ) : (
                                    <Badge variant="destructive">Falsch</Badge>
                                )}
                            </div>
                            {result.explanation && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {result.explanation}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="gap-2">
                    {!result ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={selectedIndex === null || submitting}
                        >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            Antwort prüfen
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>
                            {isLastQuestion ? 'Ergebnisse anzeigen' : 'Naechste Frage'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
