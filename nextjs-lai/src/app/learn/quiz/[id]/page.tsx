'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { QuizPlayer } from '@/src/components/QuizPlayer'
import { ExamPlayer } from '@/src/components/ExamPlayer'
import { getQuiz } from '@/src/actions/quiz'

interface Question {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    questionType?: string
    difficulty?: number
}

interface QuizData {
    id: string
    title: string
    document: { id: string; title: string; subject?: string | null }
    questions: Question[]
}

export default function QuizPlayerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const searchParams = useSearchParams()
    const isExamMode = searchParams.get('mode') === 'exam'
    const timeLimit = Number(searchParams.get('timeLimit')) || 30
    const [quiz, setQuiz] = useState<QuizData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadQuiz() {
            try {
                const data = await getQuiz(id)
                if (!data) {
                    throw new Error('Quiz konnte nicht geladen werden.')
                }
                setQuiz(data as QuizData)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Fehler beim Laden des Quiz.')
            } finally {
                setLoading(false)
            }
        }
        loadQuiz()
    }, [id])

    function handleComplete() {
        router.push(`/learn/quiz/${id}/results`)
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
            <div className="p-6 max-w-3xl mx-auto">
                <p className="text-destructive">{error || 'Quiz nicht gefunden.'}</p>
            </div>
        )
    }

    if (isExamMode) {
        return (
            <ExamPlayer
                quizId={quiz.id}
                quizTitle={quiz.title}
                questions={quiz.questions}
                timeLimit={timeLimit}
                subject={quiz.document.subject}
            />
        )
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <QuizPlayer
                quizId={quiz.id}
                quizTitle={quiz.title}
                questions={quiz.questions}
                onComplete={handleComplete}
                subject={quiz.document.subject}
            />
        </div>
    )
}
