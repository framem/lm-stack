import Link from 'next/link'
import { FileText, MessageSquare, HelpCircle, ArrowRight, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import { formatDate } from '@/src/lib/utils'
import { getDocuments } from '@/src/data-access/documents'
import { getSessions } from '@/src/data-access/chat'
import { getQuizzes, getDocumentProgress } from '@/src/data-access/quiz'

export default async function DashboardPage() {
    const [documents, sessions, quizzes, progress] = await Promise.all([
        getDocuments(),
        getSessions(),
        getQuizzes(),
        getDocumentProgress(),
    ])

    const recentSessions = sessions.slice(0, 5)
    const recentQuizzes = quizzes.slice(0, 5)

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Willkommen bei LAI — deiner KI-gestützten Lernplattform
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Dokumente
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
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/documents">
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Dokumente verwalten</h3>
                                <p className="text-sm text-muted-foreground">
                                    Dokumente hochladen, verwalten und durchsuchen
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/chat">
                    <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Chat starten</h3>
                                <p className="text-sm text-muted-foreground">
                                    Fragen zu deinen Dokumenten stellen
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/quiz">
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
            </div>

            {/* Knowledge progress per document */}
            {progress.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Wissensstand
                        </CardTitle>
                        <Link href="/quiz">
                            <Button variant="ghost" size="sm">
                                Alle anzeigen <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {progress.map((p) => (
                            <div key={p.documentId} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium truncate">{p.documentTitle}</p>
                                    <span className="text-sm font-semibold tabular-nums shrink-0">
                                        {p.percentage} %
                                    </span>
                                </div>
                                <Progress value={p.percentage} />
                                <p className="text-xs text-muted-foreground">
                                    {Math.round(p.correctScore)}/{p.answeredQuestions} Fragen richtig
                                    {p.lastAttemptAt && ` · Zuletzt: ${formatDate(p.lastAttemptAt)}`}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Chat Sessions */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Letzte Chat-Sessions</CardTitle>
                        <Link href="/chat">
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
                        <Link href="/quiz">
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
                                            href={`/quiz/${quiz.id}`}
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
