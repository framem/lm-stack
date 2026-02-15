'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { CheckCircle2, XCircle } from 'lucide-react'

interface QuestionResult {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    correctIndex: number | null
    isCorrect: boolean
    selectedIndex: number | null
    explanation?: string
    sourceSnippet?: string
    questionType?: string
    freeTextAnswer?: string
    freeTextScore?: number
    freeTextFeedback?: string
    correctAnswer?: string
}

interface QuizResultsProps {
    quizTitle: string
    documentTitle: string
    results: QuestionResult[]
    onRetry?: () => void
}

const TYPE_LABELS: Record<string, string> = {
    mc: 'Multiple Choice',
    freetext: 'Freitext',
    truefalse: 'Wahr/Falsch',
}

export function QuizResults({ quizTitle, documentTitle, results, onRetry }: QuizResultsProps) {
    // Scoring: freetext = weighted freeTextScore (0-1), mc/truefalse = binary (0 or 1)
    const totalCount = results.length
    const totalScore = results.reduce((sum, r) => {
        if (r.questionType === 'freetext') {
            return sum + (r.freeTextScore ?? 0)
        }
        return sum + (r.isCorrect ? 1 : 0)
    }, 0)
    const percentage = totalCount > 0 ? Math.round((totalScore / totalCount) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Summary card */}
            <Card>
                <CardHeader>
                    <CardTitle className="truncate">{quizTitle}</CardTitle>
                    <CardDescription>{documentTitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-4xl font-bold">{percentage}%</p>
                        <p className="text-muted-foreground">
                            {totalScore % 1 === 0 ? totalScore : totalScore.toFixed(1)} von {totalCount} Punkten erreicht
                        </p>
                    </div>
                    <Progress value={percentage} className="h-3" />
                    {onRetry && (
                        <Button onClick={onRetry} variant="outline" className="w-full">
                            Quiz wiederholen
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Individual question results */}
            {results.map((result, i) => {
                const isFreetext = result.questionType === 'freetext'
                const resultBadge = isFreetext ? (
                    <Badge variant="outline" className="shrink-0">
                        {Math.round((result.freeTextScore ?? 0) * 100)}%
                    </Badge>
                ) : result.isCorrect ? (
                    <Badge className="bg-green-600 shrink-0">Richtig</Badge>
                ) : (
                    <Badge variant="destructive" className="shrink-0">Falsch</Badge>
                )

                return (
                    <Card key={result.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base">
                                    Frage {i + 1}: {result.questionText}
                                </CardTitle>
                                {resultBadge}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                                {result.questionType && (
                                    <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                        {TYPE_LABELS[result.questionType] ?? result.questionType}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* MC / True-False: show options */}
                            {result.options && result.options.length > 0 && (
                                <div className="space-y-1">
                                    {result.options.map((option, optIdx) => {
                                        let className = 'text-sm p-2 rounded border'
                                        if (result.correctIndex !== null && optIdx === result.correctIndex) {
                                            className += ' border-green-500 bg-green-50 dark:bg-green-950'
                                        } else if (result.selectedIndex !== null && optIdx === result.selectedIndex && !result.isCorrect) {
                                            className += ' border-red-500 bg-red-50 dark:bg-red-950'
                                        }

                                        return (
                                            <div key={optIdx} className={className}>
                                                <div className="flex items-center gap-2">
                                                    {result.correctIndex !== null && optIdx === result.correctIndex && (
                                                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                                    )}
                                                    {result.selectedIndex !== null && optIdx === result.selectedIndex && !result.isCorrect && result.correctIndex !== null && optIdx !== result.correctIndex && (
                                                        <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                                    )}
                                                    <span>{option}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Freetext: show user answer and score */}
                            {isFreetext && result.freeTextAnswer && (
                                <div className="p-3 rounded-lg bg-muted/50 border space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Deine Antwort:</p>
                                        {result.freeTextScore !== undefined && (
                                            <Badge variant="outline">
                                                {Math.round(result.freeTextScore * 100)}%
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground italic">
                                        &ldquo;{result.freeTextAnswer}&rdquo;
                                    </p>
                                    {result.correctAnswer && (
                                        <div className="pt-2 border-t">
                                            <p className="text-sm font-medium mb-1">Erwartete Antwort:</p>
                                            <p className="text-sm text-muted-foreground">
                                                {result.correctAnswer}
                                            </p>
                                        </div>
                                    )}
                                    {result.freeTextFeedback && (
                                        <div className="pt-2 border-t">
                                            <p className="text-sm font-medium mb-1">Feedback:</p>
                                            <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {result.freeTextFeedback}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {result.explanation && (
                                <div className="p-3 rounded-lg bg-muted/50 border">
                                    <p className="text-sm font-medium mb-1">Erklärung:</p>
                                    <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {result.explanation}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {result.sourceSnippet && (
                                <div className="p-3 rounded-lg bg-muted/30 border border-dashed">
                                    <p className="text-sm font-medium mb-1">Quelle:</p>
                                    <p className="text-sm text-muted-foreground italic">
                                        &ldquo;{result.sourceSnippet}&rdquo;
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
