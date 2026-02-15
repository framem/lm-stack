'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import { ModelSelector } from '@/src/components/ModelSelector'
import { MetricCard } from '@/src/components/MetricCard'
import { useSSE } from '@/src/hooks/useSSE'
import { BarChart3, Loader2, ArrowRight } from 'lucide-react'

interface Model {
    id: string
    name: string
    provider: string
    dimensions: number
}

interface EvalMetrics {
    avgSimilarity: number
    topKAccuracy1: number
    topKAccuracy3: number
    topKAccuracy5: number
    mrrScore: number
    totalPhrases: number
}

interface QuickEvaluateProps {
    embeddedModelId: string | null
    models: Model[]
    visible: boolean
}

export function QuickEvaluate({ embeddedModelId, models, visible }: QuickEvaluateProps) {
    const [selectedModelId, setSelectedModelId] = useState('')
    const sse = useSSE<EvalMetrics>()

    if (!visible) return null

    const modelId = embeddedModelId ?? selectedModelId

    function startEvaluation() {
        if (!modelId) return
        sse.start(`/api/evaluate?modelId=${modelId}`)
    }

    const percentage = sse.progress
        ? Math.round((sse.progress.current / sse.progress.total) * 100)
        : 0

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Schnell-Auswertung
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Model selector — only when all-models mode */}
                {!embeddedModelId && (
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">
                            Modell für Auswertung wählen
                        </label>
                        <ModelSelector
                            models={models}
                            value={selectedModelId}
                            onValueChange={setSelectedModelId}
                        />
                    </div>
                )}

                {/* Start button */}
                {!sse.data && !sse.isRunning && (
                    <Button onClick={startEvaluation} disabled={!modelId}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Jetzt auswerten
                    </Button>
                )}

                {/* Progress */}
                {sse.isRunning && sse.progress && (
                    <div className="space-y-2">
                        <Progress value={percentage} />
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {sse.progress.message} ({percentage}%)
                        </p>
                    </div>
                )}

                {/* Error */}
                {sse.error && (
                    <p className="text-sm text-destructive">{sse.error}</p>
                )}

                {/* Results */}
                {sse.data && (
                    <div className="space-y-4">
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

                        <Link
                            href="/evaluate"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                            Detailauswertung anzeigen
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
