'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Wand2 } from 'lucide-react'

interface Chunk {
    id: string
    content: string
    chunkIndex: number
    sourceTextId?: string
    sourceText?: { title: string }
}

interface PhraseFormProps {
    chunks: Chunk[]
    onSubmit: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
    initialValues?: {
        phrase?: string
        expectedChunkId?: string
        category?: string
    }
}

export function PhraseForm({ chunks, onSubmit, initialValues }: PhraseFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedChunkId, setSelectedChunkId] = useState<string>(initialValues?.expectedChunkId || 'none')
    const [phraseValue, setPhraseValue] = useState(initialValues?.phrase || '')
    const [extractMode, setExtractMode] = useState(false)
    const [anchorIndex, setAnchorIndex] = useState<number | null>(null)
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)

    const selectedChunk = selectedChunkId !== 'none' ? chunks.find(c => c.id === selectedChunkId) : null
    const chunkWords = selectedChunk?.content.split(/\s+/).filter(w => w.length > 0) || []

    function getSelectionRange(): { start: number; end: number } {
        if (anchorIndex === null) return { start: -1, end: -1 }
        const endIdx = hoverIndex ?? anchorIndex
        return { start: Math.min(anchorIndex, endIdx), end: Math.max(anchorIndex, endIdx) }
    }

    function handleWordClick(index: number) {
        if (anchorIndex === null) {
            // First click: set anchor
            setAnchorIndex(index)
        } else {
            // Second click: finalize selection
            const start = Math.min(anchorIndex, index)
            const end = Math.max(anchorIndex, index)
            const selected = chunkWords.slice(start, end + 1).join(' ')
            setPhraseValue(selected)
            setAnchorIndex(null)
            setHoverIndex(null)
            setExtractMode(false)
        }
    }

    function toggleExtractMode() {
        setExtractMode(!extractMode)
        setAnchorIndex(null)
        setHoverIndex(null)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await onSubmit(formData)

        if (result.error) {
            setError(result.error)
        } else {
            e.currentTarget.reset()
            setPhraseValue('')
            setSelectedChunkId('none')
            setExtractMode(false)
            setAnchorIndex(null)
            setHoverIndex(null)
        }
        setLoading(false)
    }

    const { start, end } = getSelectionRange()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Suchphrase hinzufügen</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Hidden fields for re-chunk-safe ground truth */}
                    <input type="hidden" name="sourceTextId" value={selectedChunk?.sourceTextId || ''} />
                    <input type="hidden" name="expectedContent" value={selectedChunk?.content || ''} />

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Erwarteter Chunk</label>
                        <Select
                            name="expectedChunkId"
                            value={selectedChunkId}
                            onValueChange={(val) => {
                                setSelectedChunkId(val)
                                setExtractMode(false)
                                setAnchorIndex(null)
                                setHoverIndex(null)
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chunk wählen (optional)..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Kein Mapping</SelectItem>
                                {chunks.map(chunk => (
                                    <SelectItem key={chunk.id} value={chunk.id}>
                                        {chunk.sourceText?.title && `[${chunk.sourceText.title}] `}
                                        Chunk {chunk.chunkIndex}: {chunk.content.slice(0, 80)}...
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium">Phrase</label>
                            {selectedChunk && (
                                <Button
                                    type="button"
                                    variant={extractMode ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={toggleExtractMode}
                                    className="h-7 text-xs gap-1.5"
                                >
                                    <Wand2 className="h-3.5 w-3.5" />
                                    Aus Chunk extrahieren
                                </Button>
                            )}
                        </div>
                        <Textarea
                            name="phrase"
                            placeholder="Suchphrase eingeben..."
                            value={phraseValue}
                            onChange={(e) => setPhraseValue(e.target.value)}
                            required
                        />
                    </div>

                    {extractMode && selectedChunk && (
                        <div className="rounded-md border bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground mb-2">
                                {anchorIndex === null
                                    ? 'Klicke auf das erste Wort der gewünschten Phrase...'
                                    : 'Klicke auf das letzte Wort, um die Auswahl abzuschließen.'}
                            </p>
                            <div className="flex flex-wrap gap-1 max-h-60 overflow-y-auto leading-relaxed">
                                {chunkWords.map((word, i) => {
                                    const inSelection = start !== -1 && i >= start && i <= end
                                    const isAnchor = i === anchorIndex
                                    return (
                                        <span
                                            key={i}
                                            onClick={() => handleWordClick(i)}
                                            onMouseEnter={() => {
                                                if (anchorIndex !== null) setHoverIndex(i)
                                            }}
                                            className={`
                                                cursor-pointer select-none rounded px-1 py-0.5 text-sm transition-colors
                                                ${inSelection
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-muted-foreground/20'
                                                }
                                                ${isAnchor && !inSelection ? 'ring-2 ring-primary' : ''}
                                            `}
                                        >
                                            {word}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Kategorie (optional)</label>
                        <Input
                            name="category"
                            placeholder="z.B. Fakten, Definitionen..."
                            defaultValue={initialValues?.category}
                        />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit" disabled={loading}>
                        {loading ? 'Speichern...' : 'Phrase speichern'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
