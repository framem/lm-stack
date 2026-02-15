'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { ChunkViewer } from '@/src/components/ChunkViewer'
import { addSourceText, removeSourceText } from '@/src/actions/texts'
import { toast } from 'sonner'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'

interface SourceText {
    id: string
    title: string
    content: string
    createdAt: Date
    _count: { chunks: number }
    chunks?: Array<{ id: string; content: string; chunkIndex: number; tokenCount: number }>
}

interface TextsClientProps {
    initialTexts: SourceText[]
}

export function TextsClient({ initialTexts }: TextsClientProps) {
    const [showForm, setShowForm] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [chunks, setChunks] = useState<Record<string, SourceText['chunks']>>({})
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result = await addSourceText(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Text erstellt mit ${result.chunkCount} Chunks`)
                setShowForm(false)
            }
        })
    }

    async function handleDelete(id: string) {
        startTransition(async () => {
            await removeSourceText(id)
            toast.success('Text gelöscht')
        })
    }

    async function toggleChunks(id: string) {
        if (expandedId === id) {
            setExpandedId(null)
            return
        }

        if (!chunks[id]) {
            const res = await fetch(`/api/texts?id=${id}`)
            if (res.ok) {
                // Fetch chunks via separate call
                const data = await res.json()
                // For now, just show we need to expand
            }
        }
        setExpandedId(id)
    }

    return (
        <div className="space-y-6">
            <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'}>
                <Plus className="h-4 w-4 mr-2" />
                {showForm ? 'Abbrechen' : 'Neuen Text hinzufügen'}
            </Button>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Neuen Quelltext einfügen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Titel</label>
                                <Input name="title" placeholder="Titel des Texts..." required />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Inhalt</label>
                                <Textarea
                                    name="content"
                                    placeholder="Text hier einfügen..."
                                    rows={12}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Wird gespeichert...' : 'Text speichern & chunken'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                {initialTexts.map(text => (
                    <Card key={text.id}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{text.title}</h3>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="secondary">
                                            {text._count.chunks} Chunks
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {text.content.length.toLocaleString()} Zeichen
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                        {text.content}
                                    </p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleChunks(text.id)}
                                    >
                                        {expandedId === text.id ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(text.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {expandedId === text.id && text.chunks && (
                                <div className="mt-4 border-t pt-4">
                                    <ChunkViewer chunks={text.chunks} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {initialTexts.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                        Noch keine Quelltexte vorhanden. Füge einen Text hinzu, um zu beginnen.
                    </p>
                )}
            </div>
        </div>
    )
}
