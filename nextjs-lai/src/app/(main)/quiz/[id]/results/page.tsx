'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { QuizResults } from '@/src/components/QuizResults'

interface QuestionResult {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    correctIndex: number | null
    isCorrect: boolean
    selectedIndex: number | null
    explanation?: string
    sourceSnippet?: string
    questionType?: string
    freeTextAnswer?: string
    freeTextScore?: number
    freeTextFeedback?: string
    correctAnswer?: string
}

interface QuizResultData {
    id: string
    title: string
    document: { id: string; title: string }
    questions: {
        id: string
        questionText: string
        options: string[] | null
        correctIndex: number | null
        questionIndex: number
        explanation?: string
        sourceSnippet?: string
        questionType?: string
        correctAnswer?: string
        attempts: {
            selectedIndex: number | null
            isCorrect: boolean
            explanation?: string
            freeTextAnswer?: string
            freeTextScore?: number
            freeTextFeedback?: string
        }[]
    }[]
}

export default function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [data, setData] = useState<QuizResultData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadResults() {
            try {
                const response = await fetch(`/api/quiz/${id}/results`)
                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || 'Ergebnisse konnten nicht geladen werden.')
                }
                setData(await response.json())
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Fehler beim Laden der Ergebnisse.')
            } finally {
                setLoading(false)
            }
        }
        loadResults()
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <p className="text-destructive">{error || 'Ergebnisse nicht gefunden.'}</p>
            </div>
        )
    }

    // Map quiz data to results format
    const results: QuestionResult[] = data.questions.map((q) => {
        const lastAttempt = q.attempts[0]
        return {
            id: q.id,
            questionText: q.questionText,
            options: q.options,
            questionIndex: q.questionIndex,
            correctIndex: q.correctIndex,
            isCorrect: lastAttempt?.isCorrect ?? false,
            selectedIndex: lastAttempt?.selectedIndex ?? null,
            explanation: lastAttempt?.explanation ?? q.explanation,
            sourceSnippet: q.sourceSnippet,
            questionType: q.questionType,
            correctAnswer: q.correctAnswer,
            freeTextAnswer: lastAttempt?.freeTextAnswer,
            freeTextScore: lastAttempt?.freeTextScore ?? undefined,
            freeTextFeedback: lastAttempt?.freeTextFeedback,
        }
    })

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-4">
            <Button asChild variant="ghost" size="sm">
                <Link href="/quiz">
                    <ArrowLeft className="h-4 w-4" />
                    Zurück zur Übersicht
                </Link>
            </Button>

            <QuizResults
                quizTitle={data.title}
                documentTitle={data.document.title}
                results={results}
            />

            <div className="flex gap-2">
                <Button asChild>
                    <Link href={`/quiz/${id}`}>Quiz wiederholen</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/quiz">Alle Quizze</Link>
                </Button>
            </div>
        </div>
    )
}
