'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Skeleton } from '@/src/components/ui/skeleton'
import { ComparisonTable } from '@/src/components/ComparisonTable'
import { ComparisonChart } from '@/src/components/ComparisonChart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { GitCompare } from 'lucide-react'

interface Model {
    id: string
    name: string
    provider: string
    dimensions: number
}

interface ComparisonRun {
    modelId: string
    modelName: string
    dimensions: number
    provider: string
    avgSimilarity: number | null
    topKAccuracy1: number | null
    topKAccuracy3: number | null
    topKAccuracy5: number | null
    mrrScore: number | null
}

interface CompareClientProps {
    models: Model[]
}

export function CompareClient({ models }: CompareClientProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [runs, setRuns] = useState<ComparisonRun[]>([])
    const [loading, setLoading] = useState(false)

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
        const res = await fetch(`/api/compare?modelIds=${ids}`)
        const data = await res.json()
        setRuns(data.runs ?? [])
        setLoading(false)
    }

    // Auto-load when all models are selected on mount
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

                    <div className="flex gap-2">
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
                    </div>
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
                    </TabsList>

                    <TabsContent value="table">
                        <Card>
                            <CardHeader>
                                <CardTitle>Metriken-Vergleich</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ComparisonTable runs={runs} />
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
