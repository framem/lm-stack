'use client'

import React, { useTransition } from 'react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { PhraseForm } from '@/src/components/PhraseForm'
import { addTestPhrase, removeTestPhrase } from '@/src/actions/phrases'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface Chunk {
    id: string
    content: string
    chunkIndex: number
    sourceText: { title: string }
}

interface TestPhrase {
    id: string
    phrase: string
    category: string | null
    expectedChunk: {
        id: string
        content: string
        chunkIndex: number
        sourceText: { title: string }
    } | null
}

interface PhrasesClientProps {
    initialPhrases: TestPhrase[]
    chunks: Chunk[]
}

/**
 * Highlights occurrences of `phrase` within `content`.
 * Normalizes whitespace for matching, shows context around the match.
 */
function highlightPhrase(content: string, phrase: string): React.ReactNode {
    if (!phrase) return content.slice(0, 150) + (content.length > 150 ? '...' : '')

    const normalized = content.replace(/\s+/g, ' ')
    const normalizedPhrase = phrase.replace(/\s+/g, ' ')
    const idx = normalized.toLowerCase().indexOf(normalizedPhrase.toLowerCase())

    if (idx === -1) {
        return content.length > 150 ? content.slice(0, 150) + '...' : content
    }

    const matchEnd = idx + normalizedPhrase.length
    const ctxBefore = 60
    const ctxAfter = 60
    const start = Math.max(0, idx - ctxBefore)
    const end = Math.min(normalized.length, matchEnd + ctxAfter)

    return (
        <>
            {start > 0 && '...'}
            {normalized.slice(start, idx)}
            <mark className="bg-yellow-200 dark:bg-yellow-900/60 rounded px-0.5">
                {normalized.slice(idx, matchEnd)}
            </mark>
            {normalized.slice(matchEnd, end)}
            {end < normalized.length && '...'}
        </>
    )
}

export function PhrasesClient({ initialPhrases, chunks }: PhrasesClientProps) {
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(formData: FormData) {
        return addTestPhrase(formData)
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            await removeTestPhrase(id)
            toast.success('Phrase gelöscht')
        })
    }

    return (
        <div className="space-y-6">
            <PhraseForm chunks={chunks} onSubmit={handleSubmit} />

            <div className="space-y-3">
                <h2 className="text-xl font-semibold">Vorhandene Suchphrasen ({initialPhrases.length})</h2>

                {initialPhrases.map(phrase => (
                    <Card key={phrase.id}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="font-medium">{phrase.phrase}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {phrase.category && (
                                            <Badge variant="secondary">{phrase.category}</Badge>
                                        )}
                                        {phrase.expectedChunk ? (
                                            <Badge variant="outline">
                                                Erwartet: [{phrase.expectedChunk.sourceText.title}] Chunk {phrase.expectedChunk.chunkIndex}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground">
                                                Kein Chunk-Mapping
                                            </Badge>
                                        )}
                                    </div>
                                    {phrase.expectedChunk && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {highlightPhrase(phrase.expectedChunk.content, phrase.phrase)}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(phrase.id)}
                                    className="text-destructive hover:text-destructive ml-4"
                                    disabled={isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {initialPhrases.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                        Noch keine Suchphrasen vorhanden. Erstelle eine Phrase mit dem Formular oben.
                    </p>
                )}
            </div>
        </div>
    )
}
