'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Layers, Loader2, Plus, Play } from 'lucide-react'
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
import { getFlashcardsByDocument } from '@/src/actions/flashcards'

interface FlashcardWithProgress {
    id: string
    front: string
    progress: {
        repetitions: number
        nextReviewAt: string | null
    } | null
}

interface DocumentFlashcardsTabProps {
    documentId: string
}

export function DocumentFlashcardsTab({ documentId }: DocumentFlashcardsTabProps) {
    const [flashcards, setFlashcards] = useState<FlashcardWithProgress[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [progress, setProgress] = useState({ generated: 0, total: 0 })
    const [dialogOpen, setDialogOpen] = useState(false)
    const [count, setCount] = useState(10)

    useEffect(() => {
        loadFlashcards()
    }, [documentId])

    async function loadFlashcards() {
        try {
            const data = await getFlashcardsByDocument(documentId)
            setFlashcards(data as unknown as FlashcardWithProgress[])
        } catch {
            toast.error('Karteikarten konnten nicht geladen werden.')
        } finally {
            setLoading(false)
        }
    }

    async function handleGenerate() {
        setGenerating(true)
        setProgress({ generated: 0, total: count })

        try {
            const res = await fetch('/api/flashcards/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId, count }),
            })

            if (!res.ok || !res.body) throw new Error('Fehler')

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n\n')
                buffer = lines.pop() ?? ''
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const event = JSON.parse(line.slice(6))
                    if (event.type === 'progress') {
                        setProgress({ generated: event.generated, total: event.total })
                    } else if (event.type === 'complete') {
                        toast.success(`${event.generated} Karteikarten erstellt!`)
                    } else if (event.type === 'error') {
                        toast.error(event.message)
                    }
                }
            }

            setDialogOpen(false)
            await loadFlashcards()
        } catch {
            toast.error('Karteikarten-Generierung fehlgeschlagen.')
        } finally {
            setGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const total = flashcards.length
    const newCards = flashcards.filter((f) => !f.progress).length
    const due = flashcards.filter(
        (f) => f.progress && new Date(f.progress.nextReviewAt!) <= new Date()
    ).length
    const mastered = flashcards.filter(
        (f) => f.progress && f.progress.repetitions >= 3
    ).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {total === 0
                        ? 'Noch keine Karteikarten für dieses Lernmaterial.'
                        : `${total} Karteikarte${total !== 1 ? 'n' : ''}`}
                </p>
                <div className="flex items-center gap-2">
                    {total > 0 && (
                        <Button asChild size="sm" variant="outline">
                            <Link href={`/learn/flashcards/study?documentId=${documentId}`}>
                                <Play className="h-4 w-4" />
                                Lernen
                            </Link>
                        </Button>
                    )}
                    <Button onClick={() => setDialogOpen(true)} size="sm">
                        <Plus className="h-4 w-4" />
                        Generieren
                    </Button>
                </div>
            </div>

            {total > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{newCards}</p>
                                <p className="text-xs text-muted-foreground">Neu</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-orange-600">{due}</p>
                                <p className="text-xs text-muted-foreground">Fällig</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">{mastered}</p>
                                <p className="text-xs text-muted-foreground">Gelernt</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Karteikarten generieren</DialogTitle>
                        <DialogDescription>
                            Wähle die Anzahl der zu erstellenden Karteikarten.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Anzahl</label>
                            <Input
                                type="number"
                                min={1}
                                max={30}
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="mt-1"
                            />
                        </div>
                        {generating && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {progress.generated} / {progress.total} generiert...
                            </div>
                        )}
                        <Button
                            onClick={handleGenerate}
                            disabled={generating}
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
