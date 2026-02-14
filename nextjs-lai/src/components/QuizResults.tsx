'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { CheckCircle2, XCircle } from 'lucide-react'

interface QuestionResult {
    id: string
    questionText: string
    options: string[]
    questionIndex: number
    correctIndex: number
    isCorrect: boolean
    selectedIndex: number
    explanation?: string
    sourceSnippet?: string
}

interface QuizResultsProps {
    quizTitle: string
    documentTitle: string
    results: QuestionResult[]
}

export function QuizResults({ quizTitle, documentTitle, results }: QuizResultsProps) {
    const correctCount = results.filter((r) => r.isCorrect).length
    const totalCount = results.length
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Summary card */}
            <Card>
                <CardHeader>
                    <CardTitle>{quizTitle}</CardTitle>
                    <CardDescription>{documentTitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center">
                        <p className="text-4xl font-bold">{percentage}%</p>
                        <p className="text-muted-foreground">
                            {correctCount} von {totalCount} Fragen richtig
                        </p>
                    </div>
                    <Progress value={percentage} className="h-3" />
                    <div className="flex justify-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>{correctCount} richtig</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>{totalCount - correctCount} falsch</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Individual question results */}
            {results.map((result, i) => (
                <Card key={result.id}>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base">
                                Frage {i + 1}: {result.questionText}
                            </CardTitle>
                            {result.isCorrect ? (
                                <Badge className="bg-green-600 shrink-0">Richtig</Badge>
                            ) : (
                                <Badge variant="destructive" className="shrink-0">Falsch</Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            {result.options.map((option, optIdx) => {
                                let className = 'text-sm p-2 rounded border'
                                if (optIdx === result.correctIndex) {
                                    className += ' border-green-500 bg-green-50 dark:bg-green-950'
                                } else if (optIdx === result.selectedIndex && !result.isCorrect) {
                                    className += ' border-red-500 bg-red-50 dark:bg-red-950'
                                }

                                return (
                                    <div key={optIdx} className={className}>
                                        <div className="flex items-center gap-2">
                                            {optIdx === result.correctIndex && (
                                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                            )}
                                            {optIdx === result.selectedIndex && !result.isCorrect && optIdx !== result.correctIndex && (
                                                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                            )}
                                            <span>{option}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {result.explanation && (
                            <div className="p-3 rounded-lg bg-muted/50 border">
                                <p className="text-sm font-medium mb-1">Erklärung:</p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {result.explanation}
                                </p>
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
            ))}
        </div>
    )
}
