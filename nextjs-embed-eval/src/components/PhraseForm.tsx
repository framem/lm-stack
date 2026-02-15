'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'

interface Chunk {
    id: string
    content: string
    chunkIndex: number
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
        }
        setLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Testphrase hinzufügen</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Phrase</label>
                        <Textarea
                            name="phrase"
                            placeholder="Testphrase eingeben..."
                            defaultValue={initialValues?.phrase}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Kategorie (optional)</label>
                        <Input
                            name="category"
                            placeholder="z.B. Fakten, Definitionen..."
                            defaultValue={initialValues?.category}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Erwarteter Chunk</label>
                        <Select name="expectedChunkId" defaultValue={initialValues?.expectedChunkId ?? ''}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chunk wählen (optional)..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Kein Mapping</SelectItem>
                                {chunks.map(chunk => (
                                    <SelectItem key={chunk.id} value={chunk.id}>
                                        {chunk.sourceText?.title && `[${chunk.sourceText.title}] `}
                                        Chunk {chunk.chunkIndex}: {chunk.content.slice(0, 80)}...
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
