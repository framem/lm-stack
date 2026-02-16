'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { ChunkViewer } from '@/src/components/ChunkViewer'
import { addSourceText, removeSourceText, rechunkSourceText } from '@/src/actions/texts'
import { toast } from 'sonner'
import { Trash2, Plus, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

interface SourceText {
    id: string
    title: string
    content: string
    chunkSize: number
    chunkOverlap: number
    createdAt: Date
    _count: { chunks: number }
    chunks?: Array<{ id: string; content: string; chunkIndex: number; tokenCount: number }>
}

interface TextsClientProps {
    initialTexts: SourceText[]
}

function ChunkConfigInputs({ size, overlap, onSizeChange, onOverlapChange }: {
    size: number
    overlap: number
    onSizeChange: (v: number) => void
    onOverlapChange: (v: number) => void
}) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-sm font-medium mb-1.5 block">
                    Chunk-Größe <span className="text-muted-foreground font-normal">(Tokens)</span>
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={50}
                        max={1000}
                        step={50}
                        value={size}
                        onChange={e => onSizeChange(Number(e.target.value))}
                        className="flex-1"
                    />
                    <span className="text-sm font-mono w-12 text-right">{size}</span>
                </div>
            </div>
            <div>
                <label className="text-sm font-medium mb-1.5 block">
                    Overlap <span className="text-muted-foreground font-normal">(Tokens)</span>
                </label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={0}
                        max={Math.floor(size / 2)}
                        step={10}
                        value={Math.min(overlap, Math.floor(size / 2))}
                        onChange={e => onOverlapChange(Number(e.target.value))}
                        className="flex-1"
                    />
                    <span className="text-sm font-mono text-right">{Math.min(overlap, Math.floor(size / 2))} <span className="text-muted-foreground">({Math.round(Math.min(overlap, Math.floor(size / 2)) / size * 100)}%)</span></span>
                </div>
            </div>
        </div>
    )
}

export function TextsClient({ initialTexts }: TextsClientProps) {
    const [showForm, setShowForm] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [rechunkId, setRechunkId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    // Form state for new text
    const [newChunkSize, setNewChunkSize] = useState(300)
    const [newChunkOverlap, setNewChunkOverlap] = useState(60)

    // Rechunk state per text
    const [rechunkSize, setRechunkSize] = useState(300)
    const [rechunkOverlap, setRechunkOverlap] = useState(60)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        formData.set('chunkSize', String(newChunkSize))
        formData.set('chunkOverlap', String(newChunkOverlap))

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

    function openRechunk(text: SourceText) {
        setRechunkId(rechunkId === text.id ? null : text.id)
        setRechunkSize(text.chunkSize)
        setRechunkOverlap(text.chunkOverlap)
    }

    async function handleRechunk(id: string) {
        startTransition(async () => {
            const result = await rechunkSourceText(id, rechunkSize, rechunkOverlap)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Neu gechunkt: ${result.chunkCount} Chunks`)
                setRechunkId(null)
            }
        })
    }

    function toggleChunks(id: string) {
        setExpandedId(expandedId === id ? null : id)
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

                            <ChunkConfigInputs
                                size={newChunkSize}
                                overlap={newChunkOverlap}
                                onSizeChange={setNewChunkSize}
                                onOverlapChange={setNewChunkOverlap}
                            />

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
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <Badge variant="secondary">
                                            {text._count.chunks} Chunks
                                        </Badge>
                                        <Badge variant="outline">
                                            {text.chunkSize} Tokens / {text.chunkOverlap} Overlap ({Math.round(text.chunkOverlap / text.chunkSize * 100)}%)
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {text.content.length.toLocaleString()} Zeichen
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                        {text.content}
                                    </p>
                                </div>
                                <div className="flex gap-1 ml-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openRechunk(text)}
                                        title="Neu chunken"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
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

                            {/* Rechunk panel */}
                            {rechunkId === text.id && (
                                <div className="mt-4 border-t pt-4 space-y-4">
                                    <p className="text-sm font-medium">Neu chunken mit anderen Einstellungen</p>
                                    <ChunkConfigInputs
                                        size={rechunkSize}
                                        overlap={rechunkOverlap}
                                        onSizeChange={setRechunkSize}
                                        onOverlapChange={setRechunkOverlap}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleRechunk(text.id)}
                                            disabled={isPending}
                                        >
                                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                            {isPending ? 'Wird gechunkt...' : 'Neu chunken'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setRechunkId(null)}
                                        >
                                            Abbrechen
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Achtung: Bestehende Chunk-Embeddings und Phrase-Mappings gehen beim Neu-Chunken verloren.
                                    </p>
                                </div>
                            )}

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
