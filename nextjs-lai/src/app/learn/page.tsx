export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {ArrowRight, BookOpen, CalendarDays, Check, FileText, HelpCircle, Layers, MessageSquare, RotateCcw, Sparkles, TrendingUp, Upload, Clock, AlertTriangle} from 'lucide-react'
import {Card, CardContent, CardHeader, CardTitle} from '@/src/components/ui/card'
import {Button} from '@/src/components/ui/button'
import {formatDate} from '@/src/lib/utils'
import {
    getCachedDocuments,
    getCachedSessions,
    getCachedQuizzes,
    getCachedDocumentProgress,
    getCachedFlashcardDocumentProgress,
    getCachedDueReviewCount,
    getCachedDueFlashcardCount,
    getCachedFlashcardCount,
    getCachedUserStats,
    getCachedCefrProgress,
    getCachedTodayTasks,
} from '@/src/lib/dashboard-cache'
import {Badge} from '@/src/components/ui/badge'
import {Progress} from '@/src/components/ui/progress'
import {LearningProgress} from '@/src/components/LearningProgress'
import {TodayActionWidget} from '@/src/components/TodayActionWidget'
import {StreakDisplay} from '@/src/components/StreakDisplay'
import {OnboardingTrigger} from '@/src/components/OnboardingTrigger'
import {CefrProgressRing} from '@/src/components/CefrProgressRing'
import {BadgeShowcase} from '@/src/components/BadgeShowcase'
import {getLearnerProfile} from '@/src/data-access/learning-paths'
import {getEarnedBadges} from '@/src/data-access/badges'
import {ConversationWidget} from '@/src/components/ConversationWidget'

export default async function DashboardPage() {
    const [documents, sessions, quizzes, quizProgress, flashcardProgress, dueQuizReviews, dueFlashcardReviews, totalFlashcards, userStats, cefrProgress, todayTasks, profile, earnedBadges] = await Promise.all([
        getCachedDocuments(),
        getCachedSessions(),
        getCachedQuizzes(),
        getCachedDocumentProgress(),
        getCachedFlashcardDocumentProgress(),
        getCachedDueReviewCount(),
        getCachedDueFlashcardCount(),
        getCachedFlashcardCount(),
        getCachedUserStats(),
        getCachedCefrProgress(),
        getCachedTodayTasks(),
        getLearnerProfile(),
        getEarnedBadges(),
    ])

    // Action labels for document cards
    const actionLabels: Record<string, { label: string; icon: typeof HelpCircle; href: (docId: string) => string }> = {
        quiz: { label: 'Quiz starten', icon: HelpCircle, href: (docId) => `/learn/quiz?documentId=${docId}` },
        flashcards: { label: 'Karteikarten lernen', icon: Layers, href: () => '/learn/flashcards/study' },
        review: { label: 'Wiederholung starten', icon: Clock, href: () => '/learn/session' },
        read: { label: 'Dokument lesen', icon: BookOpen, href: (docId) => `/learn/documents/${docId}` },
    }

    // Merge quiz and flashcard progress per document
    const progressMap = new Map<string, {
        title: string
        quizScore: number; quizAnswered: number; quizTotal: number
        fcScore: number; fcAnswered: number; fcTotal: number
    }>()
    for (const p of quizProgress) {
        progressMap.set(p.documentId, {
            title: p.documentTitle,
            quizScore: p.answeredQuestions > 0 ? (p.percentage / 100) * p.answeredQuestions : 0,
            quizAnswered: p.answeredQuestions,
            quizTotal: p.totalQuestions,
            fcScore: 0, fcAnswered: 0, fcTotal: 0,
        })
    }
    for (const p of flashcardProgress) {
        const existing = progressMap.get(p.documentId)
        if (existing) {
            existing.fcScore = (p.percentage / 100) * p.answeredQuestions
            existing.fcAnswered = p.answeredQuestions
            existing.fcTotal = p.totalQuestions
        } else {
            progressMap.set(p.documentId, {
                title: p.documentTitle,
                quizScore: 0, quizAnswered: 0, quizTotal: 0,
                fcScore: (p.percentage / 100) * p.answeredQuestions,
                fcAnswered: p.answeredQuestions,
                fcTotal: p.totalQuestions,
            })
        }
    }
    const progress = [...progressMap.entries()].map(([documentId, d]) => {
        const totalAnswered = d.quizAnswered + d.fcAnswered
        const totalScore = d.quizScore + d.fcScore
        return {
            documentId,
            documentTitle: d.title,
            percentage: totalAnswered > 0 ? Math.round((totalScore / totalAnswered) * 100) : 0,
            answeredQuestions: totalAnswered,
            totalQuestions: d.quizTotal + d.fcTotal,
        }
    })

    const recentSessions = sessions.slice(0, 5)
    const recentQuizzes = quizzes.slice(0, 5)
    const isNewUser = documents.length === 0

    // Detect primary target language from document subjects (only languages supported in conversation)
    const targetLanguage = (() => {
        for (const doc of documents) {
            const s = doc.subject?.toLowerCase() ?? ''
            if (s.includes('spanisch')) return 'es' as const
            if (s.includes('englisch')) return 'en' as const
        }
        return 'de' as const
    })()

    // Find weakest document for the today-learning widget
    const weakestDocument = progress.length > 0
        ? progress.reduce((weakest, p) =>
            p.percentage < weakest.percentage ? p : weakest
        , progress[0])
        : undefined

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Willkommen bei LAI — deiner KI-gestützten Lernplattform
                </p>
            </div>

            {/* Onboarding wizard for new users */}
            {isNewUser && <OnboardingTrigger />}

            {/* Onboarding for new users */}
            {isNewUser && (
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-orange-500/5">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 rounded-xl bg-primary/10">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Willkommen bei LAI!</h2>
                                <p className="text-muted-foreground text-sm">In 3 Schritten zum smarten Lernen</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link href="/learn/documents">
                                <div className="flex items-start gap-3 p-4 rounded-lg border bg-background hover:bg-accent transition-colors cursor-pointer">
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">Lernmaterial hochladen</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">PDF, DOCX oder Markdown — lade deine Unterlagen hoch.</p>
                                    </div>
                                </div>
                            </Link>
                            <div className="flex items-start gap-3 p-4 rounded-lg border bg-background opacity-50">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground text-sm font-bold shrink-0">
                                    2
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Fragen stellen</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Chatte mit der KI über dein Lernmaterial.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-lg border bg-background opacity-50">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground text-sm font-bold shrink-0">
                                    3
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Wissen testen</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Erstelle Quizze und verfolge deinen Fortschritt.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center">
                            <Button size="lg" asChild>
                                <Link href="/learn/documents">
                                    <Upload className="h-4 w-4" />
                                    Erstes Lernmaterial hochladen
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Combined today action widget (merges TodayLearning + NextStep) */}
            {!isNewUser && (
                <TodayActionWidget
                    dueFlashcards={dueFlashcardReviews}
                    dueQuizReviews={dueQuizReviews}
                    weakestDocument={weakestDocument ? {
                        id: weakestDocument.documentId,
                        title: weakestDocument.documentTitle,
                        percentage: weakestDocument.percentage,
                    } : undefined}
                />
            )}

            {/* Conversation quick-start */}
            {!isNewUser && (
                <ConversationWidget targetLanguage={targetLanguage} />
            )}

            {/* Today's study plan tasks */}
            {todayTasks.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                Heutiger Lernplan
                            </h3>
                            <Link href="/learn/plan">
                                <button type="button" className="text-xs text-primary hover:underline">Zum Plan</button>
                            </Link>
                        </div>
                        <div className="space-y-1.5">
                            {todayTasks.map((task) => {
                                const isDone = task.status === 'done'
                                const Icon = task.taskType === 'quiz' ? HelpCircle
                                    : task.taskType === 'flashcards' ? Layers
                                    : task.taskType === 'review' ? RotateCcw
                                    : BookOpen
                                return (
                                    <div key={task.id} className={`flex items-center gap-2.5 text-sm ${isDone ? 'opacity-50 line-through' : ''}`}>
                                        {isDone ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                        <span className="truncate">{task.description ?? task.topic}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* CEFR progress tracker */}
            {!isNewUser && (
                <CefrProgressRing progress={cefrProgress} />
            )}

            {/* Streak display */}
            {!isNewUser && (
                <StreakDisplay
                    currentStreak={userStats.currentStreak}
                    longestStreak={userStats.longestStreak}
                    dailyGoal={userStats.dailyGoal}
                    dailyProgress={userStats.dailyProgress}
                    totalXp={(userStats as { totalXp?: number }).totalXp ?? 0}
                />
            )}

            {/* Badge showcase */}
            {!isNewUser && earnedBadges.length > 0 && (
                <BadgeShowcase earnedBadges={earnedBadges} />
            )}

            {/* Compact stats badges - only show when user has data */}
            {!isNewUser && (
                <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="font-semibold">{documents.length}</span>
                        <span className="text-muted-foreground">Dokumente</span>
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="font-semibold">{sessions.length}</span>
                        <span className="text-muted-foreground">Chat-Sessions</span>
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span className="font-semibold">{quizzes.length}</span>
                        <span className="text-muted-foreground">Quizze</span>
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        <span className="font-semibold">{totalFlashcards}</span>
                        <span className="text-muted-foreground">Karteikarten</span>
                    </Badge>
                </div>
            )}

            {/* Context-based Quick Actions - show most relevant actions based on user state */}
            {!isNewUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Show flashcards if user has few flashcards */}
                    {documents.length > 0 && totalFlashcards < 20 && (
                        <Link href="/learn/flashcards">
                            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <Layers className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Karteikarten erstellen</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Erstelle Karteikarten aus Lernmaterial
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )}

                    {/* Show chat if user hasn't used it much */}
                    {documents.length > 0 && sessions.length < 5 && (
                        <Link href="/learn/chat">
                            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="p-3 rounded-lg bg-primary/10">
                                        <MessageSquare className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Fragen stellen</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Chatte mit KI über dein Material
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )}
                </div>
            )}

            {/* Top Documents by Priority */}
            {!isNewUser && profile.prioritizedDocuments.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Dokumente nach Priorität
                        </h2>
                        <Link href="/learn/progress?tab=path">
                            <Button variant="ghost" size="sm">
                                Alle anzeigen <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {profile.prioritizedDocuments.slice(0, 5).map((doc, index) => {
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
            )}

            {/* Learning progress dashboard */}
            {(progress.length > 0 || totalFlashcards > 0) && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Lernfortschritt
                        </h2>
                        <Link href="/learn/quiz">
                            <Button variant="ghost" size="sm">
                                Alle anzeigen <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                    <LearningProgress
                        progress={progress}
                        dueQuizReviews={dueQuizReviews}
                        dueFlashcardReviews={dueFlashcardReviews}
                        totalFlashcards={totalFlashcards}
                    />
                </section>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Chat Sessions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Letzte Chat-Sessions</CardTitle>
                        <Link href="/learn/chat">
                            <Button variant="ghost" size="sm">
                                Alle anzeigen <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentSessions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Noch keine Chat-Sessions vorhanden.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {recentSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="truncate">
                                            {session.title || 'Unbenannte Session'}
                                        </span>
                                        <span className="text-muted-foreground text-xs whitespace-nowrap ml-2">
                                            {formatDate(session.createdAt)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Available Quizzes */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Verfügbare Quizze</CardTitle>
                        <Link href="/learn/quiz">
                            <Button variant="ghost" size="sm">
                                Alle anzeigen <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentQuizzes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Noch keine Quizze erstellt.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {recentQuizzes.map((quiz) => (
                                    <div
                                        key={quiz.id}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <Link
                                            href={`/learn/quiz/${quiz.id}`}
                                            className="truncate hover:underline"
                                        >
                                            {quiz.title}
                                        </Link>
                                        <span className="text-muted-foreground text-xs whitespace-nowrap ml-2">
                                            {formatDate(quiz.createdAt)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
