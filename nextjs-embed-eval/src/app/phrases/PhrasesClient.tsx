'use client'

import React, { useState, useCallback, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { highlightPhrase } from '@/src/lib/highlight'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Progress } from '@/src/components/ui/progress'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { PhraseForm } from '@/src/components/PhraseForm'
import { addTestPhrase, removeTestPhrase } from '@/src/actions/phrases'
import { toast } from 'sonner'
import { Trash2, Loader2, CheckCircle2, Sparkles } from 'lucide-react'

interface Chunk {
    id: string
    content: string
    chunkIndex: number
    sourceTextId: string
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

interface SourceTextItem {
    id: string
    title: string
    _count: { chunks: number }
}

interface PhrasesClientProps {
    initialPhrases: TestPhrase[]
    chunks: Chunk[]
    sourceTexts: SourceTextItem[]
}

export function PhrasesClient({ initialPhrases, chunks, sourceTexts }: PhrasesClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // LLM generation state
    const [selectedSourceTextId, setSelectedSourceTextId] = useState('')
    const [llmProvider, setLlmProvider] = useState<'lmstudio' | 'ollama'>('lmstudio')
    const [llmProviderUrl, setLlmProviderUrl] = useState(
        process.env.NEXT_PUBLIC_LLM_PROVIDER_URL || 'http://localhost:1234/v1'
    )
    const [llmModelName, setLlmModelName] = useState(
        process.env.NEXT_PUBLIC_LLM_MODEL || 'qwen/qwen3-8b'
    )
    const [phrasesPerChunk, setPhrasesPerChunk] = useState(3)
    const [genProgress, setGenProgress] = useState<{ current: number; total: number; message: string } | null>(null)
    const [genResult, setGenResult] = useState<{ totalGenerated: number } | null>(null)
    const [genError, setGenError] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const abortRef = useRef<AbortController | null>(null)

    // Update default URL when provider changes
    useEffect(() => {
        if (llmProvider === 'lmstudio') {
            setLlmProviderUrl('http://localhost:1234/v1')
        } else {
            setLlmProviderUrl('http://localhost:11434')
        }
    }, [llmProvider])

    const handleGenerate = useCallback(async () => {
        if (!selectedSourceTextId || !llmModelName) {
            toast.error('Bitte Quelltext und Modellname auswählen')
            return
        }

        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setIsGenerating(true)
        setGenProgress(null)
        setGenResult(null)
        setGenError(null)

        try {
            const response = await fetch('/api/generate-phrases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceTextId: selectedSourceTextId,
                    modelName: llmModelName,
                    provider: llmProvider,
                    providerUrl: llmProviderUrl,
                    phrasesPerChunk,
                }),
                signal: controller.signal,
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('Keine Antwort vom Server')

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const parsed = JSON.parse(line.slice(6))
                            if (parsed.type === 'progress') {
                                setGenProgress(parsed)
                            } else if (parsed.type === 'complete') {
                                setGenResult(parsed.data)
                                router.refresh()
                            } else if (parsed.type === 'error') {
                                setGenError(parsed.message)
                            }
                        } catch {
                            // Skip malformed lines
                        }
                    }
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setGenError(err.message)
            }
        } finally {
            setIsGenerating(false)
            abortRef.current = null
        }
    }, [selectedSourceTextId, llmModelName, llmProvider, llmProviderUrl, phrasesPerChunk, router])

    async function handleSubmit(formData: FormData) {
        return addTestPhrase(formData)
    }

    function handleDelete(id: string) {
        startTransition(async () => {
            await removeTestPhrase(id)
            toast.success('Phrase gelöscht')
        })
    }

    const genPercentage = genProgress ? Math.round((genProgress.current / genProgress.total) * 100) : 0

    return (
        <div className="space-y-6">
            <PhraseForm chunks={chunks} onSubmit={handleSubmit} />

            {/* LLM Auto-Generation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Phrasen automatisch generieren
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Ein LLM liest jeden Chunk und erzeugt passende Suchphrasen mit automatischem Ground-Truth-Mapping.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Source text selector */}
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium mb-1 block">Quelltext</label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedSourceTextId}
                                onChange={e => setSelectedSourceTextId(e.target.value)}
                                disabled={isGenerating}
                            >
                                <option value="">-- Quelltext auswählen --</option>
                                {sourceTexts.map(st => (
                                    <option key={st.id} value={st.id}>
                                        {st.title} ({st._count.chunks} Chunks)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Provider selection */}
                        <div>
                            <label className="text-sm font-medium mb-1 block">Provider</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-1.5 text-sm">
                                    <input
                                        type="radio"
                                        name="llmProvider"
                                        value="lmstudio"
                                        checked={llmProvider === 'lmstudio'}
                                        onChange={() => setLlmProvider('lmstudio')}
                                        disabled={isGenerating}
                                    />
                                    LM Studio
                                </label>
                                <label className="flex items-center gap-1.5 text-sm">
                                    <input
                                        type="radio"
                                        name="llmProvider"
                                        value="ollama"
                                        checked={llmProvider === 'ollama'}
                                        onChange={() => setLlmProvider('ollama')}
                                        disabled={isGenerating}
                                    />
                                    Ollama
                                </label>
                            </div>
                        </div>

                        {/* Provider URL */}
                        <div>
                            <label className="text-sm font-medium mb-1 block">Provider-URL</label>
                            <Input
                                value={llmProviderUrl}
                                onChange={e => setLlmProviderUrl(e.target.value)}
                                placeholder="http://localhost:1234/v1"
                                disabled={isGenerating}
                            />
                        </div>

                        {/* Model name */}
                        <div>
                            <label className="text-sm font-medium mb-1 block">Modellname</label>
                            <Input
                                value={llmModelName}
                                onChange={e => setLlmModelName(e.target.value)}
                                placeholder="z.B. llama-3.2-3b-instruct"
                                disabled={isGenerating}
                            />
                        </div>

                        {/* Phrases per chunk */}
                        <div>
                            <label className="text-sm font-medium mb-1 block">Phrasen pro Chunk</label>
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                value={phrasesPerChunk}
                                onChange={e => setPhrasesPerChunk(parseInt(e.target.value) || 3)}
                                disabled={isGenerating}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !selectedSourceTextId || !llmModelName}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Generierung läuft...
                                </>
                            ) : (
                                'Generieren'
                            )}
                        </Button>
                        {isGenerating && (
                            <Button
                                variant="outline"
                                onClick={() => abortRef.current?.abort()}
                            >
                                Abbrechen
                            </Button>
                        )}
                    </div>

                    {/* Progress display */}
                    {isGenerating && genProgress && (
                        <div className="space-y-2">
                            <Progress value={genPercentage} />
                            <p className="text-sm text-muted-foreground">
                                {genProgress.message} ({genPercentage}%)
                            </p>
                        </div>
                    )}

                    {/* Error display */}
                    {genError && (
                        <Alert variant="destructive">
                            <AlertDescription>{genError}</AlertDescription>
                        </Alert>
                    )}

                    {/* Completion display */}
                    {!isGenerating && genResult && (
                        <Alert>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <AlertDescription>
                                {genResult.totalGenerated} Phrasen erfolgreich generiert.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

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
