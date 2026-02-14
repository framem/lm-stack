'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { QuizPlayer } from '@/src/components/QuizPlayer'

interface Question {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    questionType?: string
}

interface QuizData {
    id: string
    title: string
    document: { id: string; title: string }
    questions: Question[]
}

interface AnswerResult {
    isCorrect: boolean
    correctIndex: number | null
    explanation?: string
    freeTextScore?: number
    freeTextFeedback?: string
}

export default function QuizPlayerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [quiz, setQuiz] = useState<QuizData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadQuiz() {
            try {
                const response = await fetch(`/api/quiz/${id}`)
                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.error || 'Quiz konnte nicht geladen werden.')
                }
                const data = await response.json()
                setQuiz(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Fehler beim Laden des Quiz.')
            } finally {
                setLoading(false)
            }
        }
        loadQuiz()
    }, [id])

    function handleComplete(_results: Map<string, AnswerResult>) {
        router.push(`/quiz/${id}/results`)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !quiz) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <p className="text-destructive">{error || 'Quiz nicht gefunden.'}</p>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <QuizPlayer
                quizId={quiz.id}
                quizTitle={quiz.title}
                questions={quiz.questions}
                onComplete={handleComplete}
            />
        </div>
    )
}
