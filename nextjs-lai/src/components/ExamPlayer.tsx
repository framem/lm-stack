'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/src/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Textarea } from '@/src/components/ui/textarea'
import { Progress } from '@/src/components/ui/progress'
import { Loader2, Send } from 'lucide-react'
import { ExamTimer } from '@/src/components/ExamTimer'
import { evaluateAnswer } from '@/src/actions/quiz'

interface Question {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    questionType?: string
}

interface ExamAnswer {
    selectedIndex?: number | null
    selectedIndices?: number[]
    freeTextAnswer?: string
}

interface ExamPlayerProps {
    quizId: string
    quizTitle: string
    questions: Question[]
    timeLimit: number // minutes
}

const TYPE_LABELS: Record<string, string> = {
    singleChoice: 'Single Choice',
    multipleChoice: 'Multiple Choice',
    freetext: 'Freitext',
    truefalse: 'Wahr/Falsch',
}

export function ExamPlayer({ quizId, quizTitle, questions, timeLimit }: ExamPlayerProps) {
    const router = useRouter()
    const [answers, setAnswers] = useState<Map<string, ExamAnswer>>(new Map())
    const [submitting, setSubmitting] = useState(false)
    const [submitProgress, setSubmitProgress] = useState({ current: 0, total: questions.length })
    const submittedRef = useRef(false)

    function updateAnswer(questionId: string, update: Partial<ExamAnswer>) {
        setAnswers((prev) => {
            const next = new Map(prev)
            const existing = next.get(questionId) || {}
            next.set(questionId, { ...existing, ...update })
            return next
        })
    }

    const handleSubmit = useCallback(async () => {
        if (submittedRef.current) return
        submittedRef.current = true
        setSubmitting(true)

        const total = questions.length
        let evaluated = 0

        // Evaluate all answers in parallel for speed
        const tasks = questions.map((question) => {
            const answer = answers.get(question.id)
            const type = question.questionType || 'singleChoice'

            let promise: Promise<unknown>
            if (type === 'freetext') {
                promise = evaluateAnswer(
                    question.id,
                    null,
                    answer?.freeTextAnswer || 'Keine Antwort',
                )
            } else if (type === 'multipleChoice') {
                promise = evaluateAnswer(
                    question.id,
                    null,
                    undefined,
                    answer?.selectedIndices?.length ? answer.selectedIndices : [0],
                )
            } else {
                promise = evaluateAnswer(
                    question.id,
                    answer?.selectedIndex ?? 0,
                )
            }

            return promise
                .catch((err) => console.error(`Evaluation failed for question ${question.id}:`, err))
                .finally(() => {
                    evaluated++
                    setSubmitProgress({ current: evaluated, total })
                })
        })

        await Promise.allSettled(tasks)

        router.push(`/learn/quiz/${quizId}/results`)
    }, [answers, questions, quizId, router])

    const answeredCount = questions.filter((q) => {
        const a = answers.get(q.id)
        if (!a) return false
        const type = q.questionType || 'singleChoice'
        if (type === 'freetext') return !!a.freeTextAnswer?.trim()
        if (type === 'multipleChoice') return (a.selectedIndices?.length ?? 0) > 0
        return a.selectedIndex !== null && a.selectedIndex !== undefined
    }).length

    if (submitting) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-lg font-medium">
                    Frage {submitProgress.current} von {submitProgress.total} wird ausgewertet...
                </p>
                <Progress value={(submitProgress.current / submitProgress.total) * 100} className="max-w-xs" />
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            <ExamTimer timeLimit={timeLimit} onTimeUp={handleSubmit} />

            <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">{quizTitle}</h1>
                        <p className="text-sm text-muted-foreground">
                            Prüfungsmodus — {questions.length} Fragen · {answeredCount} beantwortet
                        </p>
                    </div>
                </div>

                <Progress value={(answeredCount / questions.length) * 100} />

                {/* All questions */}
                <div className="space-y-6">
                    {questions.map((question, qIdx) => {
                        const answer = answers.get(question.id) || {}
                        const type = question.questionType || 'singleChoice'
                        const isFreetext = type === 'freetext'
                        const isMultipleChoice = type === 'multipleChoice'
                        const options = question.options

                        return (
                            <Card key={question.id} id={`q-${qIdx}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="shrink-0">
                                            {qIdx + 1}
                                        </Badge>
                                        {question.questionType && (
                                            <Badge variant="secondary" className="text-xs">
                                                {TYPE_LABELS[question.questionType] ?? question.questionType}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-base mt-2">
                                        {question.questionText}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* Multiple Choice: Checkboxes */}
                                    {isMultipleChoice && options && options.length > 0 && (
                                        <div className="space-y-2">
                                            {options.map((option, i) => {
                                                const isSelected = (answer.selectedIndices || []).includes(i)
                                                return (
                                                    <label
                                                        key={i}
                                                        className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent"
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => {
                                                                const prev = answer.selectedIndices || []
                                                                const next = isSelected
                                                                    ? prev.filter((x) => x !== i)
                                                                    : [...prev, i]
                                                                updateAnswer(question.id, { selectedIndices: next })
                                                            }}
                                                        />
                                                        <span className="text-sm">{option}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Single Choice / True-False: RadioGroup */}
                                    {!isMultipleChoice && !isFreetext && options && options.length > 0 && (
                                        <RadioGroup
                                            value={answer.selectedIndex !== null && answer.selectedIndex !== undefined ? String(answer.selectedIndex) : ''}
                                            onValueChange={(v) => updateAnswer(question.id, { selectedIndex: Number(v) })}
                                        >
                                            {options.map((option, i) => (
                                                <label
                                                    key={i}
                                                    className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent"
                                                >
                                                    <RadioGroupItem value={String(i)} />
                                                    <span className="text-sm">{option}</span>
                                                </label>
                                            ))}
                                        </RadioGroup>
                                    )}

                                    {/* Freetext */}
                                    {isFreetext && (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={answer.freeTextAnswer || ''}
                                                onChange={(e) => updateAnswer(question.id, { freeTextAnswer: e.target.value })}
                                                placeholder="Deine Antwort..."
                                                maxLength={2000}
                                                rows={3}
                                            />
                                            <p className="text-xs text-muted-foreground text-right">
                                                {(answer.freeTextAnswer || '').length}/2000
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Submit button */}
                <div className="sticky bottom-4 flex justify-center">
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        className="shadow-lg"
                    >
                        <Send className="h-4 w-4" />
                        Prüfung abgeben ({answeredCount}/{questions.length} beantwortet)
                    </Button>
                </div>
            </div>
        </div>
    )
}
