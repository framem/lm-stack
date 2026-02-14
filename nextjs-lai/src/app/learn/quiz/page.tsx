'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { HelpCircle, Loader2, FileText, TrendingUp, Plus } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/src/components/ui/dialog'
import { QuizCard } from '@/src/components/QuizCard'
import { getQuizzes, generateQuiz, deleteQuiz, getDocumentProgress } from '@/src/actions/quiz'
import { getDocuments } from '@/src/actions/documents'
import { formatDate } from '@/src/lib/utils'

interface Document {
    id: string
    title: string
    fileType: string
}

interface DocumentProgressItem {
    documentId: string
    documentTitle: string
    totalQuestions: number
    answeredQuestions: number
    correctScore: number
    percentage: number
    lastAttemptAt: string | null
}

interface Quiz {
    id: string
    title: string
    createdAt: string | Date
    document: { id: string; title: string }
    questions: {
        id: string
        questionType: string
        attempts: {
            isCorrect: boolean
            freeTextScore: number | null
            createdAt: string | Date
        }[]
    }[]
}

// Compute last attempt stats for a quiz
function getLastAttemptStats(questions: Quiz['questions']) {
    const answered = questions.filter((q) => q.attempts.length > 0)
    if (answered.length === 0) return null

    let score = 0
    let lastDate: Date | null = null
    for (const q of answered) {
        const a = q.attempts[0]
        score += q.questionType === 'freetext'
            ? (a.freeTextScore ?? (a.isCorrect ? 1 : 0))
            : (a.isCorrect ? 1 : 0)
        const d = new Date(a.createdAt)
        if (!lastDate || d > lastDate) lastDate = d
    }

    return {
        percentage: Math.round((score / answered.length) * 100),
        lastAttemptAt: lastDate!.toISOString(),
    }
}

const QUESTION_TYPES = [
    { value: 'mc', label: 'Multiple Choice' },
    { value: 'freetext', label: 'Freitext' },
    { value: 'truefalse', label: 'Wahr/Falsch' },
] as const

export default function QuizPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [documents, setDocuments] = useState<Document[]>([])
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [progress, setProgress] = useState<DocumentProgressItem[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedDocId, setSelectedDocId] = useState(searchParams.get('documentId') ?? '')
    const [generating, setGenerating] = useState(false)
    const [questionCount, setQuestionCount] = useState(5)
    const [questionTypes, setQuestionTypes] = useState<string[]>(['mc'])

    useEffect(() => {
        async function load() {
            try {
                const [docs, quizList, progressData] = await Promise.all([
                    getDocuments(),
                    getQuizzes(),
                    getDocumentProgress(),
                ])
                setDocuments(docs as unknown as Document[])
                setQuizzes(quizList as Quiz[])
                setProgress(progressData as unknown as DocumentProgressItem[])
            } catch (error) {
                console.error('Failed to load data:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    function toggleQuestionType(type: string) {
        setQuestionTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        )
    }

    async function handleGenerate() {
        if (!selectedDocId) return
        setGenerating(true)
        try {
            const { quizId } = await generateQuiz(selectedDocId, questionCount, questionTypes)
            router.push(`/learn/quiz/${quizId}`)
        } catch (error) {
            console.error('Quiz generation failed:', error)
            alert(error instanceof Error ? error.message : 'Fehler bei der Quiz-Erstellung')
        } finally {
            setGenerating(false)
        }
    }

    async function handleDelete(quizId: string) {
        if (!confirm('Quiz wirklich löschen?')) return

        try {
            await deleteQuiz(quizId)
            setQuizzes((prev) => prev.filter((q) => q.id !== quizId))
        } catch (error) {
            console.error('Quiz delete failed:', error)
            alert('Quiz konnte nicht gelöscht werden.')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const hasDocuments = documents.length > 0
    const hasQuizzes = quizzes.length > 0
    const isEmpty = !hasQuizzes && progress.length === 0

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <HelpCircle className="h-6 w-6" />
                        Quiz
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {hasQuizzes
                            ? `${quizzes.length} Quiz${quizzes.length !== 1 ? 'ze' : ''} vorhanden`
                            : 'Erstelle Quizze aus deinen Dokumenten und teste dein Wissen.'}
                    </p>
                </div>
                {hasDocuments && (
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Erstellen
                    </Button>
                )}
            </div>

            {/* Empty state */}
            {isEmpty && (
                hasDocuments ? (
                    <div className="text-center py-16 space-y-4">
                        <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground/50" />
                        <div>
                            <p className="text-lg font-medium">Noch keine Quizze</p>
                            <p className="text-muted-foreground mt-1">
                                Erstelle dein erstes Quiz, um dein Wissen zu testen.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 space-y-4">
                        <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
                        <div>
                            <p className="text-lg font-medium">Keine Dokumente vorhanden</p>
                            <p className="text-muted-foreground mt-1">
                                <Link href="/learn/documents" className="text-primary underline underline-offset-4 hover:text-primary/80">
                                    Lade zuerst ein Dokument hoch
                                </Link>
                                , um Quizze erstellen zu können.
                            </p>
                        </div>
                    </div>
                )
            )}

            {/* Knowledge progress per document */}
            {progress.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Wissensstand
                    </h2>
                    <div className="grid gap-3">
                        {progress.map((p) => (
                            <Card key={p.documentId}>
                                <CardContent className="flex items-center gap-4 py-4">
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium truncate">{p.documentTitle}</p>
                                            <span className="text-sm font-semibold tabular-nums shrink-0">
                                                {p.percentage} %
                                            </span>
                                        </div>
                                        <Progress value={p.percentage} />
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>
                                                {Math.round(p.correctScore)}/{p.answeredQuestions} Fragen richtig
                                            </span>
                                            {p.lastAttemptAt && (
                                                <span>· Zuletzt: {formatDate(p.lastAttemptAt)}</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Existing quizzes */}
            {hasQuizzes && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Vorhandene Quizze</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {quizzes.map((quiz) => {
                            const stats = getLastAttemptStats(quiz.questions)
                            return (
                                <QuizCard
                                    key={quiz.id}
                                    id={quiz.id}
                                    title={quiz.title}
                                    documentId={quiz.document.id}
                                    documentTitle={quiz.document.title}
                                    questionCount={quiz.questions.length}
                                    createdAt={String(quiz.createdAt)}
                                    lastAttemptAt={stats?.lastAttemptAt}
                                    lastAttemptPercent={stats?.percentage}
                                    onDelete={handleDelete}
                                />
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Quiz creation dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Quiz erstellen</DialogTitle>
                        <DialogDescription>
                            Wähle ein Dokument und konfiguriere deine Quiz-Einstellungen.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Dokument</label>
                            <select
                                value={selectedDocId}
                                onChange={(e) => setSelectedDocId(e.target.value)}
                                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            >
                                <option disabled value="">Dokument auswählen…</option>
                                {documents.map((doc) => (
                                    <option key={doc.id} value={doc.id}>{doc.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Anzahl Fragen</label>
                            <select
                                value={questionCount}
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                            >
                                {[3, 5, 10, 15, 20].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fragetypen</label>
                            <div className="space-y-2">
                                {QUESTION_TYPES.map((type) => (
                                    <label
                                        key={type.value}
                                        className="flex items-center gap-2.5 text-sm cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={questionTypes.includes(type.value)}
                                            onChange={() => toggleQuestionType(type.value)}
                                            className="rounded border-input"
                                        />
                                        <span>{type.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleGenerate}
                            disabled={!selectedDocId || generating || questionTypes.length === 0}
                            className="w-full"
                        >
                            {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                            Quiz generieren
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
