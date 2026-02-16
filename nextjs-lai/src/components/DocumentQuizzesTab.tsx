'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HelpCircle, Loader2, Plus, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/src/components/ui/dialog'
import { Input } from '@/src/components/ui/input'
import { getQuizzesByDocument, generateQuiz } from '@/src/actions/quiz'
import { formatDate } from '@/src/lib/utils'

interface Quiz {
    id: string
    title: string
    createdAt: string
    questions: { id: string }[]
}

interface DocumentQuizzesTabProps {
    documentId: string
}

export function DocumentQuizzesTab({ documentId }: DocumentQuizzesTabProps) {
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [count, setCount] = useState(5)
    const [types, setTypes] = useState<string[]>(['singleChoice'])

    useEffect(() => {
        getQuizzesByDocument(documentId)
            .then((data) => setQuizzes(data as unknown as Quiz[]))
            .catch(() => toast.error('Quizze konnten nicht geladen werden.'))
            .finally(() => setLoading(false))
    }, [documentId])

    async function handleGenerate() {
        setGenerating(true)
        try {
            const result = await generateQuiz(documentId, count, types)
            setDialogOpen(false)
            // Reload quizzes
            const data = await getQuizzesByDocument(documentId)
            setQuizzes(data as unknown as Quiz[])
            toast.success('Quiz erstellt!')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Quiz-Generierung fehlgeschlagen.')
        } finally {
            setGenerating(false)
        }
    }

    function toggleType(type: string) {
        setTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const typeLabels: Record<string, string> = {
        singleChoice: 'Single Choice',
        multipleChoice: 'Multiple Choice',
        freetext: 'Freitext',
        truefalse: 'Wahr/Falsch',
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {quizzes.length === 0
                        ? 'Noch keine Quizze für dieses Lernmaterial.'
                        : `${quizzes.length} Quiz${quizzes.length !== 1 ? 'ze' : ''}`}
                </p>
                <Button onClick={() => setDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4" />
                    Quiz generieren
                </Button>
            </div>

            {quizzes.length > 0 && (
                <div className="grid gap-3">
                    {quizzes.map((quiz) => (
                        <Link key={quiz.id} href={`/learn/quiz/${quiz.id}`}>
                            <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium text-sm">{quiz.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {quiz.questions.length} Fragen · {formatDate(quiz.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Quiz generieren</DialogTitle>
                        <DialogDescription>
                            Wähle die Anzahl und Fragetypen für das Quiz.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Anzahl Fragen</label>
                            <Input
                                type="number"
                                min={1}
                                max={20}
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Fragetypen</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(typeLabels).map(([key, label]) => (
                                    <Badge
                                        key={key}
                                        variant={types.includes(key) ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => toggleType(key)}
                                    >
                                        {label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <Button
                            onClick={handleGenerate}
                            disabled={generating || types.length === 0}
                            className="w-full"
                        >
                            {generating ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Wird generiert...</>
                            ) : (
                                'Generieren'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
