'use client'

import { useState, useEffect } from 'react'
import { highlightPhrase } from '@/src/lib/highlight'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { ModelSelector } from '@/src/components/ModelSelector'
import { MetricCard } from '@/src/components/MetricCard'
import { useSSE } from '@/src/hooks/useSSE'
import { formatDateTime } from '@/src/lib/utils'
import { BarChart3, Loader2, CheckCircle2, XCircle, Info } from 'lucide-react'

interface Model {
    id: string
    name: string
    provider: string
    dimensions: number
    matryoshkaDimensions: string | null
}

interface RetrievedChunk {
    chunkIndex: number
    content: string
    sourceTitle: string
    similarity: number
    isExpected: boolean
}

interface PhraseDetail {
    phrase: string
    category: string | null
    expectedChunk: {
        chunkIndex: number
        content: string
        sourceTitle: string
    } | null
    retrievedChunks: RetrievedChunk[]
    expectedRank: number | null
    isHit: boolean
}

interface CategoryBreakdown {
    category: string
    total: number
    topKAccuracy1: number
    mrrScore: number
}

interface EvalRunData {
    runId: string
    avgSimilarity: number
    topKAccuracy1: number
    topKAccuracy3: number
    topKAccuracy5: number
    mrrScore: number
    ndcgScore?: number
    chunkSize?: number
    chunkOverlap?: number
    totalPhrases: number
    matryoshkaDim?: number | null
    categoryBreakdown?: CategoryBreakdown[]
    details?: PhraseDetail[]
    rerankerName?: string | null
}

interface RerankerModel {
    id: string
    name: string
    provider: string
    providerUrl: string
}

interface EvalRun {
    id: string
    modelId: string
    rerankerId: string | null
    createdAt: Date
    avgSimilarity: number | null
    topKAccuracy1: number | null
    topKAccuracy3: number | null
    topKAccuracy5: number | null
    mrrScore: number | null
    ndcgScore: number | null
    chunkSize: number | null
    chunkOverlap: number | null
    matryoshkaDim: number | null
    model: { name: string; dimensions?: number }
    reranker: { name: string } | null
    _count: { results: number }
}

interface EvaluateClientProps {
    models: Model[]
    initialRuns: EvalRun[]
}

export function EvaluateClient({ models, initialRuns }: EvaluateClientProps) {
    const [selectedModelId, setSelectedModelId] = useState('')
    const [selectedRerankerId, setSelectedRerankerId] = useState('')
    const [selectedMatryoshkaDim, setSelectedMatryoshkaDim] = useState('')
    const [rerankerModels, setRerankerModels] = useState<RerankerModel[]>([])
    const sse = useSSE<EvalRunData>()

    // Get matryoshka dimensions for the selected model
    const selectedModel = models.find(m => m.id === selectedModelId)
    const matryoshkaDims = selectedModel?.matryoshkaDimensions
        ? selectedModel.matryoshkaDimensions.split(',').map(d => parseInt(d.trim(), 10)).filter(d => !isNaN(d))
        : []

    useEffect(() => {
        fetch('/api/reranker-models')
            .then(r => r.json())
            .then(setRerankerModels)
            .catch(() => {})
    }, [])

    function startEvaluation() {
        if (!selectedModelId) return
        const params = new URLSearchParams({ modelId: selectedModelId })
        if (selectedRerankerId && selectedRerankerId !== 'none') params.set('rerankerId', selectedRerankerId)
        if (selectedMatryoshkaDim && selectedMatryoshkaDim !== 'full') params.set('matryoshkaDim', selectedMatryoshkaDim)
        sse.start(`/api/evaluate?${params.toString()}`)
    }

    const percentage = sse.progress
        ? Math.round((sse.progress.current / sse.progress.total) * 100)
        : 0

    return (
        <div className="space-y-6">
            {/* Start evaluation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Evaluation starten
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

                    {rerankerModels.length > 0 && (
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Reranker (optional)</label>
                            <Select value={selectedRerankerId} onValueChange={setSelectedRerankerId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Kein Reranker" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Kein Reranker</SelectItem>
                                    {rerankerModels.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                            <span className="font-medium">{r.name}</span>
                                            <span className="ml-2 text-muted-foreground text-xs">({r.provider})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {matryoshkaDims.length > 0 && (
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Matryoshka-Dimension (optional)</label>
                            <Select value={selectedMatryoshkaDim} onValueChange={setSelectedMatryoshkaDim}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Volle Dimensionen" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">Voll ({selectedModel?.dimensions}d)</SelectItem>
                                    {matryoshkaDims
                                        .filter(d => d < (selectedModel?.dimensions ?? Infinity))
                                        .map(d => (
                                            <SelectItem key={d} value={String(d)}>{d}d</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">Matryoshka-Modelle erlauben Evaluation bei reduzierten Dimensionen.</p>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={startEvaluation}
                            disabled={!selectedModelId || sse.isRunning}
                        >
                            {sse.isRunning ? 'Läuft...' : 'Evaluation starten'}
                        </Button>
                        {sse.isRunning && (
                            <Button variant="outline" onClick={sse.abort}>
                                Abbrechen
                            </Button>
                        )}
                    </div>

                    {sse.isRunning && sse.progress && (
                        <div className="space-y-2">
                            <Progress value={percentage} />
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {sse.progress.message} ({percentage}%)
                            </p>
                        </div>
                    )}

                    {sse.error && (
                        <p className="text-sm text-destructive">{sse.error}</p>
                    )}
                </CardContent>
            </Card>

            {/* Metric legend */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Info className="h-4 w-4" />
                        Was bedeuten die Metriken?
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <div>
                            <dt className="font-medium">Avg. Similarity</dt>
                            <dd className="text-muted-foreground">
                                Durchschnittliche Cosine-Ähnlichkeit zwischen der Phrase und dem bestplatzierten Chunk (nicht dem erwarteten).
                                Hohe Werte heißen nicht automatisch korrekte Ergebnisse.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium">Top-1 Accuracy</dt>
                            <dd className="text-muted-foreground">
                                Anteil der Phrasen, bei denen der erwartete Chunk auf Platz 1 gefunden wurde.
                                Die wichtigste Metrik für exakte Trefferquote.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium">Top-3 / Top-5 Accuracy</dt>
                            <dd className="text-muted-foreground">
                                Anteil der Phrasen, bei denen der erwartete Chunk unter den besten 3 bzw. 5 Ergebnissen war.
                                Relevanter für RAG-Systeme, die mehrere Chunks als Kontext nutzen.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium">MRR (Mean Reciprocal Rank)</dt>
                            <dd className="text-muted-foreground">
                                Durchschnitt von 1/Rang des erwarteten Chunks.
                                Beispiel: Rang 1 → 1.0, Rang 2 → 0.5, Rang 3 → 0.33, nicht gefunden → 0.
                            </dd>
                        </div>
                        <div>
                            <dt className="font-medium">nDCG (Normalized Discounted Cumulative Gain)</dt>
                            <dd className="text-muted-foreground">
                                Ranking-Qualitätsmetrik, die höher gerankte Treffer stärker gewichtet.
                                Berechnung: 1/log₂(rang+1). Ideal bei 1.0 (Treffer auf Rang 1).
                            </dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            {/* Current results — metrics */}
            {sse.data && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Ergebnis ({sse.data.totalPhrases} Phrasen)
                        {sse.data.chunkSize != null && (
                            <Badge variant="outline" className="text-xs font-mono font-normal">
                                {sse.data.chunkSize}t / {sse.data.chunkOverlap ?? 0}o
                            </Badge>
                        )}
                        {sse.data.matryoshkaDim != null && (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs font-normal">
                                Matryoshka {sse.data.matryoshkaDim}d
                            </Badge>
                        )}
                        {sse.data.rerankerName && (
                            <Badge variant="secondary" className="text-xs font-normal">
                                mit Reranker: {sse.data.rerankerName}
                            </Badge>
                        )}
                    </h2>

                    {sse.data.totalPhrases < 30 && (
                        <div className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>
                                Bei weniger als 30 Test-Phrasen sind die Metriken statistisch nicht belastbar.
                                Für robuste Vergleiche werden mindestens 30–50 Phrasen empfohlen.
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <MetricCard
                            title="Avg. Similarity"
                            value={sse.data.avgSimilarity.toFixed(4)}
                            description="Ø Ähnlichkeit zum Top-Ergebnis"
                        />
                        <MetricCard
                            title="Top-1 Accuracy"
                            value={`${(sse.data.topKAccuracy1 * 100).toFixed(1)}%`}
                            description="Erwarteter Chunk auf Platz 1"
                        />
                        <MetricCard
                            title="Top-3 Accuracy"
                            value={`${(sse.data.topKAccuracy3 * 100).toFixed(1)}%`}
                            description="Erwarteter Chunk in Top 3"
                        />
                        <MetricCard
                            title="Top-5 Accuracy"
                            value={`${(sse.data.topKAccuracy5 * 100).toFixed(1)}%`}
                            description="Erwarteter Chunk in Top 5"
                        />
                        <MetricCard
                            title="MRR"
                            value={sse.data.mrrScore.toFixed(4)}
                            description="Ø 1/Rang des erwarteten Chunks"
                        />
                        {sse.data.ndcgScore != null && (
                            <MetricCard
                                title="nDCG"
                                value={sse.data.ndcgScore.toFixed(4)}
                                description="Ranking-Qualität (positionsgewichtet)"
                            />
                        )}
                    </div>

                    {/* Category breakdown */}
                    {sse.data.categoryBreakdown && sse.data.categoryBreakdown.length > 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Auswertung nach Kategorie</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="py-2 pr-4">Kategorie</th>
                                                <th className="py-2 pr-4 text-right">Phrasen</th>
                                                <th className="py-2 pr-4 text-right">Top-1 Accuracy</th>
                                                <th className="py-2 text-right">MRR</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sse.data.categoryBreakdown.map((cat) => (
                                                <tr key={cat.category} className="border-b last:border-0">
                                                    <td className="py-2 pr-4">
                                                        <Badge variant="secondary">{cat.category}</Badge>
                                                    </td>
                                                    <td className="py-2 pr-4 text-right font-mono">{cat.total}</td>
                                                    <td className="py-2 pr-4 text-right font-mono">
                                                        {(cat.topKAccuracy1 * 100).toFixed(1)}%
                                                    </td>
                                                    <td className="py-2 text-right font-mono">
                                                        {cat.mrrScore.toFixed(4)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Per-phrase detail */}
            {sse.data?.details && sse.data.details.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Detailergebnisse pro Phrase</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sse.data.details.map((detail, i) => (
                            <div key={i} className="rounded-md border p-4 space-y-3">
                                {/* Phrase header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="font-medium">&ldquo;{detail.phrase}&rdquo;</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            {detail.category && (
                                                <Badge variant="secondary">{detail.category}</Badge>
                                            )}
                                            {detail.isHit ? (
                                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                    Treffer auf Rang {detail.expectedRank}
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    Nicht in Top 5
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expected chunk */}
                                {detail.expectedChunk && (
                                    <div className="text-sm">
                                        <p className="text-muted-foreground font-medium mb-1">
                                            Erwarteter Chunk:
                                            <span className="font-normal ml-1">
                                                [{detail.expectedChunk.sourceTitle}] Chunk {detail.expectedChunk.chunkIndex}
                                            </span>
                                        </p>
                                        <p className="text-muted-foreground pl-3 border-l-2 border-blue-300 dark:border-blue-700">
                                            {highlightPhrase(detail.expectedChunk.content, detail.phrase)}
                                        </p>
                                    </div>
                                )}

                                {/* Retrieved chunks table */}
                                <div className="text-sm">
                                    <p className="text-muted-foreground font-medium mb-1">Gefundene Chunks (Top 5):</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-muted-foreground">
                                                    <th className="py-1.5 pr-3 w-12">Rang</th>
                                                    <th className="py-1.5 pr-3 w-24">Similarity</th>
                                                    <th className="py-1.5">Chunk</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detail.retrievedChunks.map((chunk, j) => (
                                                    <tr
                                                        key={j}
                                                        className={`border-b last:border-0 ${
                                                            chunk.isExpected
                                                                ? 'bg-green-50 dark:bg-green-950/30'
                                                                : ''
                                                        }`}
                                                    >
                                                        <td className="py-1.5 pr-3 font-mono">
                                                            <span className="flex items-center gap-1">
                                                                #{j + 1}
                                                                {chunk.isExpected && (
                                                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="py-1.5 pr-3 font-mono">
                                                            {chunk.similarity.toFixed(4)}
                                                        </td>
                                                        <td className="py-1.5 text-muted-foreground">
                                                            <p className="font-medium text-foreground mb-0.5">
                                                                [{chunk.sourceTitle}] Chunk {chunk.chunkIndex}
                                                            </p>
                                                            <p>{highlightPhrase(chunk.content, detail.phrase)}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {!detail.isHit && (
                                        <p className="mt-2 text-xs flex items-center gap-1 text-destructive">
                                            <XCircle className="h-3 w-3" />
                                            Der erwartete Chunk wurde in den Top 5 nicht gefunden.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Historical runs */}
            {initialRuns.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Bisherige Evaluierungen</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {initialRuns.map(run => (
                                <div key={run.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline">{run.model.name}</Badge>
                                        {run.matryoshkaDim != null && (
                                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                                                {run.matryoshkaDim}d
                                            </Badge>
                                        )}
                                        {run.reranker && (
                                            <Badge variant="secondary" className="text-xs">
                                                Reranker: {run.reranker.name}
                                            </Badge>
                                        )}
                                        {run.chunkSize != null && (
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {run.chunkSize}t/{run.chunkOverlap ?? 0}o
                                            </span>
                                        )}
                                        <span className="text-sm text-muted-foreground">
                                            {run._count.results} Phrasen
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span>Top-1: <strong>{run.topKAccuracy1 !== null ? `${(run.topKAccuracy1 * 100).toFixed(0)}%` : '—'}</strong></span>
                                        <span>MRR: <strong>{run.mrrScore !== null ? run.mrrScore.toFixed(3) : '—'}</strong></span>
                                        {run.ndcgScore !== null && (
                                            <span>nDCG: <strong>{run.ndcgScore.toFixed(3)}</strong></span>
                                        )}
                                        <span className="text-muted-foreground">
                                            {formatDateTime(run.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
