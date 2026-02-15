'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { QuizPlayer } from '@/src/components/QuizPlayer'
import { getReviewQuiz } from '@/src/actions/quiz'

interface Question {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    questionType?: string
}

interface ReviewData {
    id: string
    title: string
    questions: Question[]
}

export default function ReviewPage() {
    const router = useRouter()
    const [review, setReview] = useState<ReviewData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const data = await getReviewQuiz()
                setReview(data as ReviewData | null)
            } catch (err) {
                console.error('Failed to load review:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    function handleComplete() {
        router.push('/learn/quiz')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!review) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center space-y-6 mt-16">
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Alles wiederholt!</h1>
                    <p className="text-muted-foreground mt-2">
                        Aktuell sind keine Fragen zur Wiederholung fällig. Schau später nochmal vorbei.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/learn/quiz">
                        <RotateCcw className="h-4 w-4" />
                        Zurück zu Quiz
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <QuizPlayer
                quizId={review.id}
                quizTitle={review.title}
                questions={review.questions}
                onComplete={handleComplete}
            />
        </div>
    )
}
