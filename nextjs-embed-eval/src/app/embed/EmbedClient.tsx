'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { ModelSelector } from '@/src/components/ModelSelector'
import { EmbedProgress } from '@/src/components/EmbedProgress'
import { QuickEvaluate } from '@/src/components/QuickEvaluate'
import { useSSE } from '@/src/hooks/useSSE'
import { InfoTooltip } from '@/src/components/InfoTooltip'
import { FlaskConical, Layers, FileText, MessageSquareQuote, RefreshCw, ChevronDown, HelpCircle } from 'lucide-react'
import { STRATEGY_LABELS, type ChunkStrategy } from '@/src/lib/chunking'

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms} ms`
    const seconds = ms / 1000
    if (seconds < 60) return `${seconds.toFixed(1)} s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes} min ${remainingSeconds} s`
}

interface Model {
    id: string
    name: string
    provider: string
    providerUrl: string
    dimensions: number
    queryPrefix: string | null
    documentPrefix: string | null
    chunkEmbeddingCount: number
    phraseEmbeddingCount: number
    lastEmbedDurationMs: number | null
    lastEmbedAt: Date | string | null
}

interface EmbedClientProps {
    models: Model[]
}

type EmbedResult = { chunkSize?: number; chunkOverlap?: number; totalChunks?: number; modelsProcessed?: number; chunksEmbedded: number; phrasesEmbedded: number; totalDurationMs: number }

export function EmbedClient({ models }: EmbedClientProps) {
    const router = useRouter()
    const [selectedModelId, setSelectedModelId] = useState('')
    const [lastEmbedModelId, setLastEmbedModelId] = useState<string | null>(null)
    const sse = useSSE<EmbedResult>()

    // Refresh server data when embedding completes
    const prevRunning = useRef(sse.isRunning)
    useEffect(() => {
        if (prevRunning.current && !sse.isRunning && sse.data) {
            router.refresh()
        }
        prevRunning.current = sse.isRunning
    }, [sse.isRunning, sse.data, router])

    // Chunk config
    const [chunkSize, setChunkSize] = useState(300)
    const [chunkOverlap, setChunkOverlap] = useState(60)
    const [chunkStrategy, setChunkStrategy] = useState<ChunkStrategy>('sentence')
    const [semanticModelId, setSemanticModelId] = useState('')
    const [showHelp, setShowHelp] = useState(false)

    const selectedModel = models.find(m => m.id === selectedModelId)
    const maxOverlap = Math.floor(chunkSize / 2)

    function startEmbed(scope: 'chunks' | 'phrases') {
        if (!selectedModelId) return
        setLastEmbedModelId(selectedModelId)
        sse.start(`/api/embed?modelId=${selectedModelId}&scope=${scope}`)
    }

    function startAll() {
        setLastEmbedModelId(null)
        sse.start('/api/embed-all')
    }

    function startRechunkEmbed() {
        setLastEmbedModelId(selectedModelId || null)
        const overlap = Math.min(chunkOverlap, maxOverlap)
        const modelParam = selectedModelId ? `&modelId=${selectedModelId}` : ''
        const semanticParam = chunkStrategy === 'semantic' && semanticModelId ? `&semanticModelId=${semanticModelId}` : ''
        sse.start(`/api/rechunk-embed?chunkSize=${chunkSize}&chunkOverlap=${overlap}&strategy=${chunkStrategy}${modelParam}${semanticParam}`)
    }

    return (
        <div className="space-y-6">
            {/* Rechunk + Embed */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Re-Chunk & Embed
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                Chunk-Größe <span className="text-muted-foreground font-normal">(Tokens)</span>
                                <InfoTooltip text="Die Ziel-Größe jedes Text-Chunks in Tokens (~4 Zeichen pro Token). Kleinere Chunks = präzisere Suche, aber weniger Kontext. Größere Chunks = mehr Kontext, aber ungenauere Treffer. Typisch: 200–500 Tokens." />
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={50}
                                    max={1000}
                                    step={50}
                                    value={chunkSize}
                                    onChange={e => setChunkSize(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-sm font-mono w-12 text-right">{chunkSize}</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                Overlap <span className="text-muted-foreground font-normal">(Tokens)</span>
                                <InfoTooltip text="Überlappung zwischen aufeinanderfolgenden Chunks in Tokens. Verhindert, dass Informationen an Chunk-Grenzen verloren gehen. Typisch: 10–20% der Chunk-Größe." />
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={0}
                                    max={maxOverlap}
                                    step={10}
                                    value={Math.min(chunkOverlap, maxOverlap)}
                                    onChange={e => setChunkOverlap(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-sm font-mono text-right">{Math.min(chunkOverlap, maxOverlap)} <span className="text-muted-foreground">({Math.round(Math.min(chunkOverlap, maxOverlap) / chunkSize * 100)}%)</span></span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">
                                Strategie
                                <InfoTooltip text={
                                    chunkStrategy === 'sentence'
                                        ? 'Satzgrenzen: Splittet an Satzgrenzen. Gut für natürliche Texte.'
                                        : chunkStrategy === 'paragraph'
                                            ? 'Absatzgrenzen: Splittet an Absätzen. Gut für strukturierte Dokumente.'
                                            : chunkStrategy === 'semantic'
                                                ? 'Semantisch: Nutzt Embedding-Ähnlichkeit zwischen Satzgruppen, um Chunk-Grenzen an Themenwechseln zu setzen.'
                                                : 'Rekursiv: Hierarchisches Splitting (Absätze → Sätze → Wörter). Flexibel für gemischte Inhalte.'
                                } />
                            </label>
                            <select
                                value={chunkStrategy}
                                onChange={e => setChunkStrategy(e.target.value as ChunkStrategy)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {(Object.entries(STRATEGY_LABELS) as [ChunkStrategy, string][]).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {chunkStrategy === 'semantic' && (
                        <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3 space-y-2">
                            <label className="text-sm font-medium block">
                                Modell für semantisches Chunking
                                <InfoTooltip text="Verwendet Embeddings um Chunk-Grenzen an Themenwechseln zu setzen. Benötigt ein Embedding-Modell für die Analyse." />
                            </label>
                            <select
                                value={semanticModelId}
                                onChange={e => setSemanticModelId(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">Automatisch (erstes verfügbares Modell)</option>
                                {models.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.dimensions}d)</option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Dieses Modell wird nur für die Chunk-Grenz-Analyse verwendet, nicht für die finalen Embeddings.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            onClick={startRechunkEmbed}
                            disabled={models.length === 0 || sse.isRunning}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {selectedModelId
                                ? 'Re-Chunk & Modell einbetten'
                                : `Re-Chunk & alle Modelle einbetten (${models.length})`
                            }
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            {STRATEGY_LABELS[chunkStrategy]} · {chunkSize}t / {Math.min(chunkOverlap, maxOverlap)}o ({Math.round(Math.min(chunkOverlap, maxOverlap) / chunkSize * 100)}%)
                            {selectedModelId ? ` — ${selectedModel?.name}` : ` — ${models.length} Modelle`}
                        </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Alle Texte werden neu gechunkt, dann werden Chunks & Phrasen eingebettet.
                        Bestehende Chunk-Embeddings werden überschrieben.
                    </p>

                    {/* Collapsible help section */}
                    <button
                        type="button"
                        onClick={() => setShowHelp(h => !h)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>Hilfe</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showHelp ? 'rotate-180' : ''}`} />
                    </button>

                    {showHelp && (
                        <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground space-y-2">
                            <p>
                                <strong>Ablauf:</strong> Alle Texte werden neu in Chunks aufgeteilt,
                                bestehende Ground-Truth-Zuordnungen werden automatisch aktualisiert,
                                und dann werden alle Chunks & Suchphrasen eingebettet.
                            </p>
                            <p>
                                <strong>Manuell vs. Grid-Search:</strong> Hier können Sie eine einzelne
                                Konfiguration testen. Nutzen Sie die <em>Grid-Search</em>-Seite, um
                                automatisch viele Kombinationen aus Chunk-Größe, Overlap und Strategie
                                zu vergleichen und die optimale Konfiguration zu finden.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Single model embed */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5" />
                        Einzeln einbetten
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Modell wählen</label>
                        <ModelSelector
                            models={models}
                            value={selectedModelId}
                            onValueChange={setSelectedModelId}
                        />
                    </div>

                    {selectedModel && (
                        <div className="flex gap-2 text-sm">
                            <Badge variant="outline">{selectedModel.dimensions}d</Badge>
                            <span className="text-muted-foreground">
                                {selectedModel.chunkEmbeddingCount} Chunk-Embeddings,{' '}
                                {selectedModel.phraseEmbeddingCount} Phrasen-Embeddings vorhanden
                            </span>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            onClick={() => startEmbed('chunks')}
                            disabled={!selectedModelId || sse.isRunning}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Texte einbetten
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => startEmbed('phrases')}
                            disabled={!selectedModelId || sse.isRunning}
                        >
                            <MessageSquareQuote className="h-4 w-4 mr-2" />
                            Suchphrasen einbetten
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={startAll}
                            disabled={models.length === 0 || sse.isRunning}
                        >
                            <Layers className="h-4 w-4 mr-2" />
                            Alle Modelle einbetten ({models.length})
                        </Button>
                    </div>

                    {sse.isRunning && (
                        <Button variant="outline" onClick={sse.abort}>
                            Abbrechen
                        </Button>
                    )}
                </CardContent>
            </Card>

            <EmbedProgress
                progress={sse.progress}
                isRunning={sse.isRunning}
                error={sse.error}
                result={sse.data}
            />

            <QuickEvaluate
                embeddedModelId={lastEmbedModelId}
                models={models}
                visible={!sse.isRunning && !!sse.data}
            />

            {/* Model overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Modell-Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {models.map(model => (
                            <div key={model.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <span className="font-medium">{model.name}</span>
                                    <Badge variant="outline">{model.dimensions}d</Badge>
                                    <Badge variant="secondary">{model.provider}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground text-right">
                                    <div>{model.chunkEmbeddingCount} Chunks, {model.phraseEmbeddingCount} Phrasen</div>
                                    {model.lastEmbedDurationMs != null && model.lastEmbedDurationMs > 0 && (
                                        <div>
                                            {formatDuration(model.lastEmbedDurationMs)}
                                            {model.chunkEmbeddingCount > 0 && (
                                                <> · {((model.chunkEmbeddingCount + model.phraseEmbeddingCount) / (model.lastEmbedDurationMs / 1000)).toFixed(1)} Items/s</>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {models.length === 0 && (
                            <p className="text-muted-foreground">
                                Keine Modelle registriert. Gehe zu <strong>Modelle</strong>, um eines hinzuzufügen.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
