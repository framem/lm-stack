export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
    ArrowLeft,
    ArrowRight,
    FileText,
    HelpCircle,
    Layers,
    Clock,
    FolderOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { getSubjectDetail } from '@/src/data-access/subjects'
import { formatDate } from '@/src/lib/utils'

interface Props {
    params: Promise<{ subject: string }>
}

export default async function SubjectWorkspacePage({ params }: Props) {
    const { subject: rawSubject } = await params
    const subject = decodeURIComponent(rawSubject)
    const detail = await getSubjectDetail(subject)

    if (!detail) notFound()

    const avgProgress = detail.documents.length > 0
        ? Math.round(detail.documents.reduce((s, d) => s + d.progress, 0) / detail.documents.length)
        : 0

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/learn/subjects">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <FolderOpen className="h-7 w-7 text-primary" />
                        {subject}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {detail.documents.length} Dokument{detail.documents.length !== 1 ? 'e' : ''} in diesem Fach
                    </p>
                </div>
            </div>

            {/* Due reviews banner */}
            {detail.dueReviews > 0 && (
                <Card className="border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-background">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-orange-500" />
                            <span className="font-medium">
                                {detail.dueReviews} Wiederholung{detail.dueReviews !== 1 ? 'en' : ''} fällig
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                                <Link href={`/learn/flashcards?subject=${encodeURIComponent(subject)}`}>
                                    <Layers className="h-4 w-4" />
                                    Karteikarten
                                </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                                <Link href={`/learn/quiz?subject=${encodeURIComponent(subject)}`}>
                                    <HelpCircle className="h-4 w-4" />
                                    Quiz
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Dokumente
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{detail.documents.length}</div>
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
                        <div className="text-2xl font-bold">{detail.totalQuizzes}</div>
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
                        <div className="text-2xl font-bold">{detail.totalFlashcards}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Wissensstand
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgProgress}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
                <Button asChild>
                    <Link href={`/learn/quiz?subject=${encodeURIComponent(subject)}`}>
                        <HelpCircle className="h-4 w-4" />
                        Quiz starten
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href={`/learn/flashcards?subject=${encodeURIComponent(subject)}`}>
                        <Layers className="h-4 w-4" />
                        Karteikarten lernen
                    </Link>
                </Button>
            </div>

            {/* Documents in this subject */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold">Dokumente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detail.documents.map((doc) => (
                        <Link key={doc.id} href={`/learn/documents/${doc.id}`}>
                            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium truncate">{doc.title}</span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                            {formatDate(doc.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span>{doc.quizCount} Quiz{doc.quizCount !== 1 ? 'ze' : ''}</span>
                                        <span>{doc.flashcardCount} Karteikarte{doc.flashcardCount !== 1 ? 'n' : ''}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Fortschritt</span>
                                            <span className="font-medium">{doc.progress}%</span>
                                        </div>
                                        <Progress value={doc.progress} className="h-1.5" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Recent quizzes */}
            {detail.recentQuizzes.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Letzte Quizze</h2>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/learn/quiz?subject=${encodeURIComponent(subject)}`}>
                                Alle anzeigen <ArrowRight className="h-4 w-4 ml-1" />
                            </Link>
                        </Button>
                    </div>
                    <Card>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {detail.recentQuizzes.map((quiz) => (
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
                                        <div className="flex items-center gap-2 text-muted-foreground text-xs whitespace-nowrap ml-2">
                                            <Badge variant="outline" className="text-xs">
                                                {quiz.questionCount} Fragen
                                            </Badge>
                                            {formatDate(quiz.createdAt)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    )
}
