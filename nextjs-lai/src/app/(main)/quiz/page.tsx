'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, Loader2, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { QuizCard } from '@/src/components/QuizCard'

interface Document {
    id: string
    title: string
    fileType: string
}

interface Quiz {
    id: string
    title: string
    createdAt: string
    document: { id: string; title: string }
    questions: { id: string }[]
}

export default function QuizPage() {
    const router = useRouter()
    const [documents, setDocuments] = useState<Document[]>([])
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState<string | null>(null)
    const [questionCount, setQuestionCount] = useState(5)

    useEffect(() => {
        async function load() {
            try {
                const [docsRes, quizzesRes] = await Promise.all([
                    fetch('/api/documents'),
                    fetch('/api/quiz'),
                ])
                if (docsRes.ok) setDocuments(await docsRes.json())
                if (quizzesRes.ok) setQuizzes(await quizzesRes.json())
            } catch (error) {
                console.error('Failed to load data:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    async function handleGenerate(documentId: string) {
        setGenerating(documentId)
        try {
            const response = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId, questionCount }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Fehler bei der Quiz-Erstellung')
            }

            const { quizId } = await response.json()
            router.push(`/quiz/${quizId}`)
        } catch (error) {
            console.error('Quiz generation failed:', error)
            alert(error instanceof Error ? error.message : 'Fehler bei der Quiz-Erstellung')
        } finally {
            setGenerating(null)
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
                    <>
                        <div className="flex items-center gap-4">
                            <label className="text-sm text-muted-foreground">Anzahl Fragen:</label>
                            <select
                                value={questionCount}
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                className="border rounded px-2 py-1 text-sm bg-background"
                            >
                                {[3, 5, 10, 15, 20].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {documents.map((doc) => (
                                <Card key={doc.id}>
                                    <CardHeader>
                                        <CardTitle className="text-base">{doc.title}</CardTitle>
                                        <CardDescription>{doc.fileType}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={() => handleGenerate(doc.id)}
                                            disabled={generating !== null}
                                            size="sm"
                                        >
                                            {generating === doc.id && (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )}
                                            Quiz generieren
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </section>

            {/* Existing quizzes */}
            {quizzes.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Vorhandene Quizze</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {quizzes.map((quiz) => (
                            <QuizCard
                                key={quiz.id}
                                id={quiz.id}
                                title={quiz.title}
                                documentTitle={quiz.document.title}
                                questionCount={quiz.questions.length}
                                createdAt={quiz.createdAt}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
