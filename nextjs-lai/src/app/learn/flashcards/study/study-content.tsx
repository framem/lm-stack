'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, Layers, XCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { FlashcardPlayer, type ReviewResult } from '@/src/components/FlashcardPlayer'
import { getDueFlashcards, getFlashcards } from '@/src/actions/flashcards'

interface FlashcardItem {
    id: string
    front: string
    back: string
    context?: string | null
    document?: { id: string; title: string } | null
    chunk?: { id: string; content: string; chunkIndex: number } | null
}

// Simple shuffle (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

export function StudyContent() {
    const searchParams = useSearchParams()
    const practiceAll = searchParams.get('all') === 'true'

    const [cards, setCards] = useState<FlashcardItem[]>([])
    const [loading, setLoading] = useState(true)
    const [completed, setCompleted] = useState(false)
    const [results, setResults] = useState<ReviewResult[]>([])

    useEffect(() => {
        async function load() {
            try {
                if (practiceAll) {
                    const data = await getFlashcards()
                    setCards(shuffle(data as unknown as FlashcardItem[]))
                } else {
                    const data = await getDueFlashcards()
                    setCards(data as unknown as FlashcardItem[])
                }
            } catch (err) {
                console.error('Failed to load flashcards:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [practiceAll])

    function handleComplete(reviewResults: ReviewResult[]) {
        setResults(reviewResults)
        setCompleted(true)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (cards.length === 0) {
        return (
            <div className="p-6 max-w-3xl mx-auto text-center space-y-6 mt-16">
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Alles gelernt!</h1>
                    <p className="text-muted-foreground mt-2">
                        Aktuell sind keine Karteikarten zur Wiederholung fällig. Schau später nochmal vorbei.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/learn/flashcards">
                        <Layers className="h-4 w-4" />
                        Zurück zu Karteikarten
                    </Link>
                </Button>
            </div>
        )
    }

    // Completion summary screen
    if (completed) {
        const known = results.filter((r) => r.quality === 5).length
        const unsure = results.filter((r) => r.quality === 3).length
        const unknown = results.filter((r) => r.quality === 1).length
        const total = results.length

        return (
            <div className="p-6 max-w-3xl mx-auto space-y-8 mt-8">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">Lernsession abgeschlossen!</h1>
                    <p className="text-muted-foreground">
                        Du hast {total} Karteikarte{total !== 1 ? 'n' : ''} durchgearbeitet.
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="flex flex-col items-center p-4 gap-2">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <span className="text-2xl font-bold">{known}</span>
                            <span className="text-xs text-muted-foreground">Gewusst</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-4 gap-2">
                            <HelpCircle className="h-6 w-6 text-yellow-600" />
                            <span className="text-2xl font-bold">{unsure}</span>
                            <span className="text-xs text-muted-foreground">Unsicher</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-4 gap-2">
                            <XCircle className="h-6 w-6 text-red-600" />
                            <span className="text-2xl font-bold">{unknown}</span>
                            <span className="text-xs text-muted-foreground">Nicht gewusst</span>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/learn/flashcards">
                            <Layers className="h-4 w-4" />
                            Zurück zu Karteikarten
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/learn">
                            Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <FlashcardPlayer cards={cards} onComplete={handleComplete} />
        </div>
    )
}
