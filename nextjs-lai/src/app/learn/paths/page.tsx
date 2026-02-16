export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
    Route,
    Sparkles,
    ArrowRight,
    FileText,
    HelpCircle,
    Layers,
    BookOpen,
    Clock,
    TrendingUp,
    AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { getLearnerProfile } from '@/src/data-access/learning-paths'
import { generateLearningRecommendation, type LearningRecommendation } from '@/src/lib/learning-path-generator'

const actionLabels: Record<string, { label: string; icon: typeof HelpCircle; href: (docId: string) => string }> = {
    quiz: { label: 'Quiz starten', icon: HelpCircle, href: (docId) => `/learn/quiz?documentId=${docId}` },
    flashcards: { label: 'Karteikarten lernen', icon: Layers, href: () => '/learn/flashcards/study' },
    review: { label: 'Wiederholung starten', icon: Clock, href: () => '/learn/session' },
    read: { label: 'Dokument lesen', icon: BookOpen, href: (docId) => `/learn/documents/${docId}` },
}

export default async function LearningPathsPage() {
    const profile = await getLearnerProfile()

    let recommendation: LearningRecommendation | null = null
    if (profile.documents.length > 0) {
        recommendation = await generateLearningRecommendation(profile)
    }

    const recDoc = recommendation
        ? profile.documents.find((d) => d.documentId === recommendation!.documentId)
        : null
    const recAction = recommendation ? actionLabels[recommendation.nextAction] : null

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Route className="h-8 w-8 text-primary" />
                    Dein Lernpfad
                </h1>
                <p className="text-muted-foreground mt-1">
                    Personalisierte Empfehlungen basierend auf deinem Lernfortschritt
                </p>
            </div>

            {profile.documents.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <Route className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-semibold mb-2">Noch kein Lernfortschritt</h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Bearbeite Quizze oder Karteikarten, um personalisierte Lernempfehlungen zu erhalten.
                        </p>
                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" asChild>
                                <Link href="/learn/quiz">Quiz starten</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/learn/flashcards">Karteikarten lernen</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* AI Recommendation */}
                    {recommendation && recAction && (
                        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-orange-500/5">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary/10">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">KI-Empfehlung</h2>
                                        {recDoc && (
                                            <p className="text-sm text-muted-foreground">
                                                {recDoc.documentTitle}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm">{recommendation.reason}</p>

                                <div className="flex flex-wrap items-center gap-3">
                                    <Button asChild>
                                        <Link href={recAction.href(recommendation.documentId)}>
                                            <recAction.icon className="h-4 w-4" />
                                            {recAction.label}
                                        </Link>
                                    </Button>
                                    {recommendation.estimatedMinutes > 0 && (
                                        <Badge variant="secondary">
                                            ~{recommendation.estimatedMinutes} Min.
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Global stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{profile.totalDocuments}</p>
                                    <p className="text-xs text-muted-foreground">Aktive Dokumente</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{profile.avgScore}%</p>
                                    <p className="text-xs text-muted-foreground">Durchschn. Wissensstand</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{profile.currentStreak}</p>
                                    <p className="text-xs text-muted-foreground">Tage Streak</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Document progress cards sorted by priority */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold">Dokumente nach Priorität</h2>
                        <div className="space-y-3">
                            {profile.prioritizedDocuments.map((doc, index) => {
                                const isWeak = doc.avgScore < 50 && doc.totalAttempts > 0

                                // Determine best action per document
                                const docAction = doc.totalAttempts === 0 && doc.quizCount > 0
                                    ? actionLabels.quiz
                                    : doc.totalAttempts === 0 && doc.flashcardCount > 0
                                        ? actionLabels.flashcards
                                        : doc.dueItems > 0 && doc.flashcardCount > 0
                                            ? actionLabels.flashcards
                                            : doc.dueItems > 0
                                                ? actionLabels.review
                                                : isWeak && doc.quizCount > 0
                                                    ? actionLabels.quiz
                                                    : actionLabels.read

                                return (
                                    <Card key={doc.documentId} className={isWeak ? 'border-orange-500/30' : ''}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/learn/documents/${doc.documentId}`}
                                                                className="font-medium truncate hover:underline"
                                                            >
                                                                {doc.documentTitle}
                                                            </Link>
                                                            {isWeak && (
                                                                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                            {doc.subject && (
                                                                <Badge variant="outline" className="text-xs">{doc.subject}</Badge>
                                                            )}
                                                            <span>{doc.quizCount} Quizze</span>
                                                            <span>{doc.flashcardCount} Karteikarten</span>
                                                            {doc.dueItems > 0 && (
                                                                <Badge variant="secondary" className="text-xs gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {doc.dueItems} fällig
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 shrink-0">
                                                    <div className="w-32 space-y-1 hidden sm:block">
                                                        <Progress value={doc.avgScore} className="h-2" />
                                                        <p className="text-xs text-muted-foreground text-right">
                                                            {doc.avgScore}%
                                                        </p>
                                                    </div>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={docAction.href(doc.documentId)}>
                                                            <docAction.icon className="h-4 w-4" />
                                                            <span className="hidden lg:inline">{docAction.label}</span>
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}
