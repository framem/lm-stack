'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
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

interface EvalRunData {
    runId: string
    avgSimilarity: number
    topKAccuracy1: number
    topKAccuracy3: number
    topKAccuracy5: number
    mrrScore: number
    totalPhrases: number
    details?: PhraseDetail[]
}

interface EvalRun {
    id: string
    modelId: string
    createdAt: Date
    avgSimilarity: number | null
    topKAccuracy1: number | null
    topKAccuracy3: number | null
    topKAccuracy5: number | null
    mrrScore: number | null
    model: { name: string; dimensions?: number }
    _count: { results: number }
}

interface EvaluateClientProps {
    models: Model[]
    initialRuns: EvalRun[]
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

export function EvaluateClient({ models, initialRuns }: EvaluateClientProps) {
    const [selectedModelId, setSelectedModelId] = useState('')
    const sse = useSSE<EvalRunData>()

    function startEvaluation() {
        if (!selectedModelId) return
        sse.start(`/api/evaluate?modelId=${selectedModelId}`)
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
                    </dl>
                </CardContent>
            </Card>

            {/* Current results — metrics */}
            {sse.data && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Ergebnis ({sse.data.totalPhrases} Phrasen)
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                    </div>
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
                                        <span className="text-sm text-muted-foreground">
                                            {run._count.results} Phrasen
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span>Top-1: <strong>{run.topKAccuracy1 !== null ? `${(run.topKAccuracy1 * 100).toFixed(0)}%` : '—'}</strong></span>
                                        <span>Top-3: <strong>{run.topKAccuracy3 !== null ? `${(run.topKAccuracy3 * 100).toFixed(0)}%` : '—'}</strong></span>
                                        <span>MRR: <strong>{run.mrrScore !== null ? run.mrrScore.toFixed(3) : '—'}</strong></span>
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
