import Link from 'next/link'
import { Layers, HelpCircle, BookOpen, Clock, Sparkles, GraduationCap, Zap, Languages } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { getLearnerProfile } from '@/src/data-access/learning-paths'
import { generateLearningRecommendation } from '@/src/lib/learning-path-generator'

interface TodayActionWidgetProps {
    dueFlashcards: number
    dueQuizReviews: number
    dueVocabByLanguage?: Record<string, number>
    dueDocumentFlashcards?: number
    weakestDocument?: {
        id: string
        title: string
        percentage: number
    }
}

/**
 * Combined "Deine nächste Aktion" widget that merges TodayLearning + NextStep.
 * Shows due reviews first, then AI recommendation if nothing due.
 */
export async function TodayActionWidget({
    dueFlashcards,
    dueQuizReviews,
    dueVocabByLanguage,
    dueDocumentFlashcards,
    weakestDocument,
}: TodayActionWidgetProps) {
    const vocabTotal = Object.values(dueVocabByLanguage ?? {}).reduce((a, b) => a + b, 0)
    const totalDue = (dueDocumentFlashcards ?? dueFlashcards) + dueQuizReviews + vocabTotal
    const hasDueReviews = totalDue > 0

    // Fetch recommendation only if no due reviews
    let recommendation: Awaited<ReturnType<typeof generateLearningRecommendation>> | null = null
    if (!hasDueReviews) {
        const profile = await getLearnerProfile()
        if (profile.documents.length > 0) {
            recommendation = await generateLearningRecommendation(profile)
        }
    }

    // Don't show widget if nothing to do
    if (!hasDueReviews && !recommendation && !weakestDocument) return null

    return (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-orange-500/5">
            <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                        {hasDueReviews ? (
                            <Clock className="h-5 w-5 text-primary" />
                        ) : (
                            <Sparkles className="h-5 w-5 text-primary" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold">
                            {hasDueReviews ? 'Heute lernen' : 'Deine nächste Aktion'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {hasDueReviews
                                ? (() => {
                                    const parts: string[] = []
                                    if (dueVocabByLanguage) {
                                        for (const [lang, count] of Object.entries(dueVocabByLanguage)) {
                                            if (count > 0) parts.push(`${count} ${lang}-Vokabeln`)
                                        }
                                    }
                                    const docDue = (dueDocumentFlashcards ?? dueFlashcards) + dueQuizReviews
                                    if (docDue > 0) parts.push(`${docDue} Dokument-Wiederholungen`)
                                    return parts.length > 0
                                        ? parts.join(', ') + ' fällig'
                                        : `${totalDue} Wiederholung${totalDue !== 1 ? 'en' : ''} fällig`
                                })()
                                : recommendation?.reason || 'Mach weiter so!'}
                        </p>
                    </div>
                    {/* Primary action button */}
                    {hasDueReviews ? (
                        <Button asChild>
                            <Link href="/learn/daily">
                                <Zap className="h-4 w-4" />
                                Jetzt wiederholen
                            </Link>
                        </Button>
                    ) : recommendation ? (
                        <Button asChild>
                            <Link
                                href={
                                    recommendation.nextAction === 'quiz'
                                        ? `/learn/quiz?documentId=${recommendation.documentId}`
                                        : recommendation.nextAction === 'flashcards'
                                          ? '/learn/flashcards/study'
                                          : recommendation.nextAction === 'review'
                                            ? '/learn/session'
                                            : `/learn/documents/${recommendation.documentId}`
                                }
                            >
                                {recommendation.nextAction === 'quiz' ? (
                                    <HelpCircle className="h-4 w-4" />
                                ) : recommendation.nextAction === 'flashcards' ? (
                                    <Layers className="h-4 w-4" />
                                ) : (
                                    <BookOpen className="h-4 w-4" />
                                )}
                                {recommendation.nextAction === 'quiz'
                                    ? 'Quiz starten'
                                    : recommendation.nextAction === 'flashcards'
                                      ? 'Karteikarten'
                                      : 'Los gehts'}
                            </Link>
                        </Button>
                    ) : null}
                </div>

                {/* Due badges */}
                {hasDueReviews && (
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Per-language vocab badges */}
                        {dueVocabByLanguage && Object.entries(dueVocabByLanguage).map(([lang, count]) => (
                            count > 0 && (
                                <Link key={lang} href={`/learn/language/${encodeURIComponent(lang)}`}>
                                    <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary/80">
                                        <Languages className="h-3 w-3" />
                                        {count} {lang}-Vokabel{count !== 1 ? 'n' : ''}
                                    </Badge>
                                </Link>
                            )
                        ))}
                        {/* Document flashcards */}
                        {(dueDocumentFlashcards ?? dueFlashcards) > 0 && (
                            <Badge variant="secondary" className="gap-1">
                                <Layers className="h-3 w-3" />
                                {dueDocumentFlashcards ?? dueFlashcards} Dokument-Karteikarte{(dueDocumentFlashcards ?? dueFlashcards) !== 1 ? 'n' : ''}
                            </Badge>
                        )}
                        {dueQuizReviews > 0 && (
                            <Badge variant="secondary" className="gap-1">
                                <HelpCircle className="h-3 w-3" />
                                {dueQuizReviews} Quizfrage{dueQuizReviews !== 1 ? 'n' : ''}
                            </Badge>
                        )}
                        {recommendation?.estimatedMinutes && recommendation.estimatedMinutes > 0 && (
                            <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                ~{recommendation.estimatedMinutes} Min
                            </Badge>
                        )}
                    </div>
                )}

                {/* Secondary actions */}
                <div className="flex flex-wrap items-center gap-2">
                    {hasDueReviews && (
                        <>
                            <Button asChild size="sm" variant="outline">
                                <Link href="/learn/session">
                                    <GraduationCap className="h-4 w-4" />
                                    Volle Session
                                </Link>
                            </Button>
                            {dueFlashcards > 0 && (
                                <Button asChild size="sm" variant="outline">
                                    <Link href="/learn/flashcards/study">
                                        <Layers className="h-4 w-4" />
                                        Karteikarten
                                    </Link>
                                </Button>
                            )}
                            {dueQuizReviews > 0 && (
                                <Button asChild size="sm" variant="outline">
                                    <Link href="/learn/quiz/review">
                                        <HelpCircle className="h-4 w-4" />
                                        Quiz
                                    </Link>
                                </Button>
                            )}
                        </>
                    )}
                </div>

                {/* Weakest document recommendation (if present and not showing AI rec) */}
                {weakestDocument && hasDueReviews && (
                    <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1.5">Schwächstes Thema</p>
                        <Link
                            href={`/learn/documents/${weakestDocument.id}`}
                            className="flex items-center gap-2 text-sm hover:underline"
                        >
                            <span className="truncate font-medium">{weakestDocument.title}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                                {weakestDocument.percentage}%
                            </Badge>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
