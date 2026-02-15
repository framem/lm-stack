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
import { BarChart3, Loader2, CheckCircle2 } from 'lucide-react'

interface Model {
    id: string
    name: string
    provider: string
    dimensions: number
}

interface EvalRunData {
    runId: string
    avgSimilarity: number
    topKAccuracy1: number
    topKAccuracy3: number
    topKAccuracy5: number
    mrrScore: number
    totalPhrases: number
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

            {/* Current results */}
            {sse.data && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Ergebnis ({sse.data.totalPhrases} Phrasen)
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <MetricCard title="Avg. Similarity" value={sse.data.avgSimilarity.toFixed(4)} />
                        <MetricCard title="Top-1 Accuracy" value={`${(sse.data.topKAccuracy1 * 100).toFixed(1)}%`} />
                        <MetricCard title="Top-3 Accuracy" value={`${(sse.data.topKAccuracy3 * 100).toFixed(1)}%`} />
                        <MetricCard title="Top-5 Accuracy" value={`${(sse.data.topKAccuracy5 * 100).toFixed(1)}%`} />
                        <MetricCard title="MRR" value={sse.data.mrrScore.toFixed(4)} />
                    </div>
                </div>
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
