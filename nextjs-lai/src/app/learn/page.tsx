export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {ArrowRight, FileText, HelpCircle, Layers, MessageSquare, Sparkles, TrendingUp, Upload} from 'lucide-react'
import {Card, CardContent, CardHeader, CardTitle} from '@/src/components/ui/card'
import {Button} from '@/src/components/ui/button'
import {formatDate} from '@/src/lib/utils'
import {getDocuments} from '@/src/data-access/documents'
import {getSessions} from '@/src/data-access/chat'
import {getDocumentProgress, getDueReviewCount, getQuizzes} from '@/src/data-access/quiz'
import {getDueFlashcardCount, getFlashcardCount, getFlashcardDocumentProgress} from '@/src/data-access/flashcards'
import {getOrCreateUserStats} from '@/src/data-access/user-stats'
import {LearningProgress} from '@/src/components/LearningProgress'
import {TodayLearningWidget} from '@/src/components/TodayLearningWidget'
import {StreakDisplay} from '@/src/components/StreakDisplay'
import {OnboardingTrigger} from '@/src/components/OnboardingTrigger'
import {NextStepWidget} from '@/src/components/NextStepWidget'

export default async function DashboardPage() {
    const [documents, sessions, quizzes, quizProgress, flashcardProgress, dueQuizReviews, dueFlashcardReviews, totalFlashcards, userStats] = await Promise.all([
        getDocuments(),
        getSessions(),
        getQuizzes(),
        getDocumentProgress(),
        getFlashcardDocumentProgress(),
        getDueReviewCount(),
        getDueFlashcardCount(),
        getFlashcardCount(),
        getOrCreateUserStats(),
    ])

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

    // Find weakest document for the today-learning widget
    const weakestDocument = progress.length > 0
        ? progress.reduce((weakest, p) =>
            p.percentage < weakest.percentage ? p : weakest
        , progress[0])
        : undefined

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
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

            {/* Today learning widget */}
            {!isNewUser && (
                <TodayLearningWidget
                    dueFlashcards={dueFlashcardReviews}
                    dueQuizReviews={dueQuizReviews}
                    weakestDocument={weakestDocument ? {
                        id: weakestDocument.documentId,
                        title: weakestDocument.documentTitle,
                        percentage: weakestDocument.percentage,
                    } : undefined}
                />
            )}

            {/* Next step recommendation */}
            {!isNewUser && progress.length > 0 && (
                <NextStepWidget />
            )}

            {/* Streak display */}
            {!isNewUser && (
                <StreakDisplay
                    currentStreak={userStats.currentStreak}
                    longestStreak={userStats.longestStreak}
                    dailyGoal={userStats.dailyGoal}
                    dailyProgress={userStats.dailyProgress}
                />
            )}

            {/* Stats - only show when user has data */}
            {!isNewUser && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Lernmaterial
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{documents.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Chat-Sessions
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sessions.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Quizze
                        </CardTitle>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{quizzes.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Karteikarten
                        </CardTitle>
                        <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFlashcards}</div>
                    </CardContent>
                </Card>
            </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/learn/documents">
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Lernmaterial verwalten</h3>
                                <p className="text-sm text-muted-foreground">
                                    Lernmaterial hochladen, verwalten und durchsuchen
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/learn/chat">
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Chat starten</h3>
                                <p className="text-sm text-muted-foreground">
                                    Fragen zu deinem Lernmaterial stellen
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/learn/quiz">
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <HelpCircle className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Quiz starten</h3>
                                <p className="text-sm text-muted-foreground">
                                    Wissen mit Quizfragen testen
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/learn/flashcards">
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <Layers className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Karteikarten lernen</h3>
                                <p className="text-sm text-muted-foreground">
                                    Karteikarten erstellen und wiederholen
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

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
