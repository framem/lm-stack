'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HelpCircle, Loader2, FileText, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
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
            router.push(`/quiz/${quizId}`)
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

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <HelpCircle className="h-6 w-6" />
                    Quiz
                </h1>
                <p className="text-muted-foreground mt-1">
                    Erstelle Quizze aus deinen Dokumenten und teste dein Wissen.
                </p>
            </div>

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

            {/* Generate new quiz */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold">Neues Quiz erstellen</h2>
                {documents.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                Keine Dokumente vorhanden. Lade zuerst ein Dokument hoch.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            {/* Document select */}
                            <div className="space-y-1.5">
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

                            {/* Settings row */}
                            <div className="flex items-center gap-6 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-muted-foreground">Anzahl Fragen:</label>
                                    <select
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                                        className="border rounded-md px-2 py-1 text-sm bg-background"
                                    >
                                        {[3, 5, 10, 15, 20].map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground">Fragetypen:</span>
                                    {QUESTION_TYPES.map((type) => (
                                        <label key={type.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={questionTypes.includes(type.value)}
                                                onChange={() => toggleQuestionType(type.value)}
                                                className="rounded border-input"
                                            />
                                            <span className="text-muted-foreground">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Generate button */}
                            <Button
                                onClick={handleGenerate}
                                disabled={!selectedDocId || generating || questionTypes.length === 0}
                            >
                                {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                                Quiz generieren
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* Existing quizzes */}
            {quizzes.length > 0 && (
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
        </div>
    )
}
