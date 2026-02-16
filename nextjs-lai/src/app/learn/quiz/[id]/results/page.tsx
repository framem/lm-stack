'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { QuizResults } from '@/src/components/QuizResults'
import { QuizRecommendations } from '@/src/components/QuizRecommendations'
import { getQuizResults } from '@/src/actions/quiz'
import { getQuestionIdsWithFlashcards } from '@/src/actions/flashcards'
import { isFreetextLikeType } from '@/src/lib/quiz-types'

interface QuestionResult {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    correctIndex: number | null
    correctIndices?: number[]
    isCorrect: boolean
    selectedIndex: number | null
    selectedIndices?: number[]
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
        correctIndices?: number[] | null
        questionIndex: number
        explanation?: string
        sourceSnippet?: string
        sourceChunkId?: string | null
        sourceChunk?: { chunkIndex: number } | null
        questionType?: string
        correctAnswer?: string
        attempts: {
            selectedIndex: number | null
            selectedIndices?: number[] | null
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
    const router = useRouter()
    const [data, setData] = useState<QuizResultData | null>(null)
    const [savedQuestionIds, setSavedQuestionIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadResults() {
            try {
                const result = await getQuizResults(id)
                if (!result) {
                    throw new Error('Ergebnisse konnten nicht geladen werden.')
                }
                setData(result as QuizResultData)
                const questionIds = result.questions.map((q) => q.id)
                const saved = await getQuestionIdsWithFlashcards(questionIds)
                setSavedQuestionIds(saved)
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
            correctIndices: (q.correctIndices as number[] | null) ?? undefined,
            isCorrect: lastAttempt?.isCorrect ?? false,
            selectedIndex: lastAttempt?.selectedIndex ?? null,
            selectedIndices: (lastAttempt?.selectedIndices as number[] | null) ?? undefined,
            explanation: lastAttempt?.explanation ?? q.explanation,
            sourceSnippet: q.sourceSnippet,
            questionType: q.questionType,
            correctAnswer: q.correctAnswer,
            freeTextAnswer: lastAttempt?.freeTextAnswer,
            freeTextScore: lastAttempt?.freeTextScore ?? undefined,
            freeTextFeedback: lastAttempt?.freeTextFeedback,
        }
    })

    // Compute weak topics from incorrect answers
    const weakTopicMap = new Map<string, { documentId: string; documentTitle: string; chunkIndex: number | null; incorrectCount: number }>()
    for (const q of data.questions) {
        const lastAttempt = q.attempts[0]
        if (!lastAttempt) continue
        const isIncorrect = isFreetextLikeType(q.questionType)
            ? (lastAttempt.freeTextScore ?? 0) < 0.5
            : !lastAttempt.isCorrect
        if (!isIncorrect) continue

        const chunkIndex = q.sourceChunk?.chunkIndex ?? null
        const key = `${data.document.id}-${chunkIndex}`
        const existing = weakTopicMap.get(key)
        if (existing) {
            existing.incorrectCount++
        } else {
            weakTopicMap.set(key, {
                documentId: data.document.id,
                documentTitle: data.document.title,
                chunkIndex,
                incorrectCount: 1,
            })
        }
    }
    const weakTopics = [...weakTopicMap.values()].sort((a, b) => b.incorrectCount - a.incorrectCount)

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-4">
            <Button asChild variant="ghost" size="sm">
                <Link href="/learn/quiz">
                    <ArrowLeft className="h-4 w-4" />
                    Zurück zur Übersicht
                </Link>
            </Button>

            <QuizResults
                quizTitle={data.title}
                documentTitle={data.document.title}
                results={results}
                onRetry={() => router.push(`/learn/quiz/${id}`)}
                initialSavedIds={savedQuestionIds}
            />

            <QuizRecommendations weakTopics={weakTopics} />

            <div className="flex gap-2">
                <Button asChild>
                    <Link href={`/learn/quiz/${id}`}>Quiz wiederholen</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/learn/quiz">Alle Quizze</Link>
                </Button>
            </div>
        </div>
    )
}
