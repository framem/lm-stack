'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Skeleton } from '@/src/components/ui/skeleton'
import {
    Route,
    Sparkles,
    FileText,
    HelpCircle,
    Layers,
    BookOpen,
    Clock,
    TrendingUp,
    AlertTriangle,
    BarChart3,
    Map,
} from 'lucide-react'
import { StatsCharts } from '@/src/components/StatsCharts'
import { BadgeShowcase } from '@/src/components/BadgeShowcase'
import { ConversationStats } from '@/src/components/ConversationStats'
import type { LearningRecommendation } from '@/src/lib/learning-path-generator'
import type { TopicCompetency } from '@/src/data-access/topics'
import { getCompetencies, getDocumentList } from '../knowledge-map/actions'

// Lazy load chart component — uses recharts
const KnowledgeMapChart = dynamic(
    () => import('@/src/components/KnowledgeMapChart').then((m) => m.KnowledgeMapChart),
    { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> },
)

const actionLabels: Record<string, { label: string; icon: typeof HelpCircle; href: (docId: string) => string }> = {
    quiz: { label: 'Quiz starten', icon: HelpCircle, href: (docId) => `/learn/quiz?documentId=${docId}` },
    flashcards: { label: 'Karteikarten lernen', icon: Layers, href: () => '/learn/flashcards/study' },
    review: { label: 'Wiederholung starten', icon: Clock, href: () => '/learn/session' },
    read: { label: 'Dokument lesen', icon: BookOpen, href: (docId) => `/learn/documents/${docId}` },
}

interface ProgressPageClientProps {
    profile: Awaited<ReturnType<typeof import('@/src/data-access/learning-paths').getLearnerProfile>>
    recommendation: LearningRecommendation | null
    dailyActivity: Awaited<ReturnType<typeof import('@/src/data-access/stats').getDailyActivity>>
    knowledgeTrend: Awaited<ReturnType<typeof import('@/src/data-access/stats').getKnowledgeTrend>>
    subjectDistribution: Awaited<ReturnType<typeof import('@/src/data-access/stats').getSubjectDistribution>>
    earnedBadges: Awaited<ReturnType<typeof import('@/src/data-access/badges').getEarnedBadges>>
    evaluationStats: Awaited<ReturnType<typeof import('@/src/data-access/conversation-evaluation').getEvaluationStats>>
}

export function ProgressPageClient({
    profile,
    recommendation,
    dailyActivity,
    knowledgeTrend,
    subjectDistribution,
    earnedBadges,
    evaluationStats,
}: ProgressPageClientProps) {
    const searchParams = useSearchParams()
    const tabParam = searchParams.get('tab')
    const defaultTab = (tabParam === 'stats' || tabParam === 'map' || tabParam === 'path') ? tabParam : 'path'

    const [competencies, setCompetencies] = useState<TopicCompetency[]>([])
    const [documents, setDocuments] = useState<{ id: string; title: string }[]>([])
    const [selectedDocId, setSelectedDocId] = useState<string | ''>('')
    const [loadingMap, setLoadingMap] = useState(true)

    const recDoc = recommendation
        ? profile.documents.find((d) => d.documentId === recommendation!.documentId)
        : null
    const recAction = recommendation ? actionLabels[recommendation.nextAction] : null

    const hasStatsData = dailyActivity.length > 0 || knowledgeTrend.length > 0 || subjectDistribution.length > 0

    // Load knowledge map data
    useEffect(() => {
        getDocumentList().then(setDocuments).catch(() => {})
    }, [])

    useEffect(() => {
        let cancelled = false

        const loadData = async () => {
            if (cancelled) return
            setLoadingMap(true)

            try {
                const data = await getCompetencies(selectedDocId || undefined)
                if (!cancelled) {
                    setCompetencies(data)
                }
            } catch {
                if (!cancelled) {
                    setCompetencies([])
                }
            } finally {
                if (!cancelled) {
                    setLoadingMap(false)
                }
            }
        }

        loadData()

        return () => {
            cancelled = true
        }
    }, [selectedDocId])

    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="path" className="gap-2">
                    <Route className="h-4 w-4" />
                    Lernpfad
                </TabsTrigger>
                <TabsTrigger value="stats" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Statistiken
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                    <Map className="h-4 w-4" />
                    Wissenslandkarte
                </TabsTrigger>
            </TabsList>

            {/* Learning Path Tab */}
            <TabsContent value="path" className="space-y-6 mt-6">
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
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="space-y-6 mt-6">
                {/* Badge showcase */}
                <BadgeShowcase earnedBadges={earnedBadges} />

                {/* Conversation stats */}
                {evaluationStats.totalEvaluations > 0 && (
                    <ConversationStats stats={evaluationStats} />
                )}

                {hasStatsData ? (
                    <StatsCharts
                        dailyActivity={dailyActivity}
                        knowledgeTrend={knowledgeTrend}
                        subjectDistribution={subjectDistribution}
                    />
                ) : (
                    <div className="text-center py-16 space-y-2">
                        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <p className="text-lg font-medium">Noch keine Statistiken</p>
                        <p className="text-sm text-muted-foreground">
                            Bearbeite Quizze und lerne Karteikarten, um Statistiken zu sehen.
                        </p>
                    </div>
                )}
            </TabsContent>

            {/* Knowledge Map Tab */}
            <TabsContent value="map" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-muted-foreground">
                            Überblick über deinen Wissensstand nach Themen.
                        </p>
                    </div>

                    <select
                        value={selectedDocId}
                        onChange={(e) => setSelectedDocId(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">Alle Dokumente</option>
                        {documents.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                                {doc.title}
                            </option>
                        ))}
                    </select>
                </div>

                {loadingMap ? (
                    <div className="space-y-4">
                        <Skeleton className="h-[400px] w-full" />
                        <div className="grid gap-3 md:grid-cols-2">
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                        </div>
                    </div>
                ) : (
                    <KnowledgeMapChart competencies={competencies} />
                )}
            </TabsContent>
        </Tabs>
    )
}
