import Link from 'next/link'
import { Layers, HelpCircle, BookOpen, ArrowRight, GraduationCap, Clock } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'

interface TodayLearningWidgetProps {
    dueFlashcards: number
    dueQuizReviews: number
    weakestDocument?: {
        id: string
        title: string
        percentage: number
    }
}

export function TodayLearningWidget({
    dueFlashcards,
    dueQuizReviews,
    weakestDocument,
}: TodayLearningWidgetProps) {
    const totalDue = dueFlashcards + dueQuizReviews

    if (totalDue === 0 && !weakestDocument) return null

    return (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-orange-500/5">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Heute lernen</h2>
                            {totalDue > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {totalDue} Wiederholung{totalDue !== 1 ? 'en' : ''} fällig
                                </p>
                            )}
                        </div>
                    </div>
                    {/* Primary CTA: Quick daily practice */}
                    {totalDue > 0 && (
                        <Button asChild>
                            <Link href="/learn/daily">
                                <Clock className="h-4 w-4" />
                                5 Minuten lernen
                            </Link>
                        </Button>
                    )}
                </div>

                {totalDue > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {dueFlashcards > 0 && (
                            <Badge variant="secondary" className="gap-1">
                                <Layers className="h-3 w-3" />
                                {dueFlashcards} Karteikarte{dueFlashcards !== 1 ? 'n' : ''}
                            </Badge>
                        )}
                        {dueQuizReviews > 0 && (
                            <Badge variant="secondary" className="gap-1">
                                <HelpCircle className="h-3 w-3" />
                                {dueQuizReviews} Quizfrage{dueQuizReviews !== 1 ? 'n' : ''}
                            </Badge>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    {totalDue > 0 && (
                        <Button asChild size="sm" variant="outline">
                            <Link href="/learn/session">
                                <GraduationCap className="h-4 w-4" />
                                Lern-Session
                            </Link>
                        </Button>
                    )}
                    {dueFlashcards > 0 && (
                        <Button asChild size="sm" variant="outline">
                            <Link href="/learn/flashcards/study">
                                <Layers className="h-4 w-4" />
                                Karteikarten lernen
                            </Link>
                        </Button>
                    )}
                    {dueQuizReviews > 0 && (
                        <Button asChild size="sm" variant="outline">
                            <Link href="/learn/quiz/review">
                                <HelpCircle className="h-4 w-4" />
                                Quiz wiederholen
                            </Link>
                        </Button>
                    )}
                </div>

                {weakestDocument && (
                    <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Empfehlung: schwächstes Thema</p>
                        <Link
                            href={`/learn/documents/${weakestDocument.id}`}
                            className="flex items-center gap-2 text-sm font-medium hover:underline"
                        >
                            {weakestDocument.title}
                            <Badge variant="outline" className="text-xs">
                                {weakestDocument.percentage}%
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
