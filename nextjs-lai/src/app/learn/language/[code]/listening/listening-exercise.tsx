'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Headphones } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { QuizPlayer } from '@/src/components/QuizPlayer'
import { generateQuiz } from '@/src/actions/quiz'

interface ListeningExerciseProps {
    languageCode: string
    languageName: string
    documents: { id: string; title: string }[]
}

interface Question {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    questionType?: string
    ttsText?: string | null
    ttsLang?: string | null
}

interface QuizData {
    id: string
    title: string
    questions: Question[]
}

export function ListeningExercise({ languageCode, languageName, documents }: ListeningExerciseProps) {
    const router = useRouter()
    const [quiz, setQuiz] = useState<QuizData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function generate() {
            try {
                // Use the first document (usually A1)
                const docId = documents[0].id
                const result = await generateQuiz(docId, 10, ['listening'])
                // Fetch the quiz data
                const { getQuiz } = await import('@/src/actions/quiz')
                const quizData = await getQuiz(result.quizId)
                if (!quizData) throw new Error('Quiz konnte nicht geladen werden.')
                setQuiz(quizData as unknown as QuizData)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Fehler beim Generieren der Hörübungen.')
            } finally {
                setLoading(false)
            }
        }
        generate()
    }, [documents])

    function handleComplete() {
        if (quiz) {
            router.push(`/learn/quiz/${quiz.id}/results`)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Hörübungen werden erstellt...</p>
            </div>
        )
    }

    if (error || !quiz) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/learn/language/${languageCode}`}>
                        <ArrowLeft className="h-4 w-4" />
                        Zurück
                    </Link>
                </Button>
                <p className="text-destructive">{error || 'Hörübungen konnten nicht geladen werden.'}</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/learn/language/${languageCode}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold">Hörverstehen — {languageName}</h1>
                </div>
            </div>
            <QuizPlayer
                quizId={quiz.id}
                quizTitle={`Hörverstehen: ${languageName}`}
                questions={quiz.questions}
                onComplete={handleComplete}
                subject={languageName}
            />
        </div>
    )
}
