'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import { ComparisonTable, type ComparisonRun } from '@/src/components/ComparisonTable'
import { ComparisonChart } from '@/src/components/ComparisonChart'
import { ParetoChart, type ParetoPoint } from '@/src/components/ParetoChart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { GitCompare, History, Clock } from 'lucide-react'

interface Model {
    id: string
    name: string
    provider: string
    dimensions: number
}

interface CompareClientProps {
    models: Model[]
}

export function CompareClient({ models }: CompareClientProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [runs, setRuns] = useState<ComparisonRun[]>([])
    const [loading, setLoading] = useState(false)
    const [showAllRuns, setShowAllRuns] = useState(false)
    const [paretoMetric, setParetoMetric] = useState('Top-1')

    function toggleModel(id: string) {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    async function loadComparison() {
        if (selectedIds.size === 0) return
        setLoading(true)

        const ids = Array.from(selectedIds).join(',')
        const allParam = showAllRuns ? '&all=true' : ''
        const res = await fetch(`/api/compare?modelIds=${ids}${allParam}`)
        const data = await res.json()
        setRuns(data.runs ?? [])
        setLoading(false)
    }

    // Build Pareto points from runs that have latency data
    function buildParetoPoints(): ParetoPoint[] {
        const metricKey = paretoMetric === 'Top-1' ? 'topKAccuracy1'
            : paretoMetric === 'MRR' ? 'mrrScore'
            : 'ndcgScore'

        return runs
            .filter(r => r.lastEmbedDurationMs != null && r[metricKey] != null)
            .map(r => ({
                runId: r.id ?? `${r.modelId}-${r.modelName}`,
                modelName: r.modelName,
                dimensions: r.dimensions,
                chunkSize: r.chunkSize ?? null,
                chunkOverlap: r.chunkOverlap ?? null,
                chunkStrategy: r.chunkStrategy ?? null,
                quality: (r[metricKey] as number) ?? 0,
                latency: r.lastEmbedDurationMs!,
                isPareto: false, // computed in chart component
                label: r.modelName,
            }))
    }

    // Auto-select all models on mount
    useEffect(() => {
        if (models.length > 0 && selectedIds.size === 0) {
            setSelectedIds(new Set(models.map(m => m.id)))
        }
    }, [models, selectedIds.size])

    return (
        <div className="space-y-6">
            {/* Model selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GitCompare className="h-5 w-5" />
                        Modelle zum Vergleich wählen
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {models.map(model => (
                            <Badge
                                key={model.id}
                                variant={selectedIds.has(model.id) ? 'default' : 'outline'}
                                className="cursor-pointer text-sm py-1.5 px-3"
                                onClick={() => toggleModel(model.id)}
                            >
                                {model.name} ({model.dimensions}d)
                            </Badge>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={loadComparison} disabled={selectedIds.size === 0 || loading}>
                            {loading ? 'Laden...' : 'Vergleich laden'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedIds(new Set(models.map(m => m.id)))}
                        >
                            Alle wählen
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Auswahl aufheben
                        </Button>
                        <div className="ml-auto flex items-center gap-2">
                            <Button
                                variant={showAllRuns ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setShowAllRuns(!showAllRuns)}
                                className="gap-1.5"
                            >
                                {showAllRuns ? (
                                    <><History className="h-4 w-4" /> Alle Runs</>
                                ) : (
                                    <><Clock className="h-4 w-4" /> Nur letzte</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {showAllRuns && (
                        <p className="text-xs text-muted-foreground">
                            Alle historischen Eval-Runs werden angezeigt — inklusive verschiedener Chunk-Konfigurationen.
                            So kannst du Chunk-Size- und Overlap-Varianten direkt vergleichen.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Results */}
            {loading && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </CardContent>
                </Card>
            )}

            {!loading && runs.length > 0 && (
                <Tabs defaultValue="table">
                    <TabsList>
                        <TabsTrigger value="table">Tabelle</TabsTrigger>
                        <TabsTrigger value="chart">Chart</TabsTrigger>
                        {showAllRuns && <TabsTrigger value="pareto">Pareto</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="table">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Metriken-Vergleich
                                    {showAllRuns && (
                                        <span className="text-sm font-normal text-muted-foreground ml-2">
                                            ({runs.length} Runs)
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ComparisonTable runs={runs} showChunkConfig={showAllRuns} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="chart">
                        <Card>
                            <CardHeader>
                                <CardTitle>Visueller Vergleich</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ComparisonChart runs={runs} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {showAllRuns && (
                        <TabsContent value="pareto">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pareto-Front (Qualität vs. Latenz)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ParetoChart
                                        points={buildParetoPoints()}
                                        qualityMetric={paretoMetric}
                                        onMetricChange={setParetoMetric}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            )}

            {!loading && runs.length === 0 && selectedIds.size > 0 && (
                <p className="text-center text-muted-foreground py-12">
                    Noch keine Evaluierungsdaten vorhanden. Führe zuerst eine Evaluation unter <strong>Auswertung</strong> durch.
                </p>
            )}

            {models.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                    Keine Modelle registriert. Gehe zu <strong>Modelle</strong>, um welche hinzuzufügen.
                </p>
            )}
        </div>
    )
}
