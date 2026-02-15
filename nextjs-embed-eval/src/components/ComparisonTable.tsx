'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/src/components/ui/table'
import { Badge } from '@/src/components/ui/badge'

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

interface ComparisonTableProps {
    runs: ComparisonRun[]
}

function formatPercent(value: number | null): string {
    if (value === null) return '—'
    return `${(value * 100).toFixed(1)}%`
}

function formatScore(value: number | null): string {
    if (value === null) return '—'
    return value.toFixed(4)
}

export function ComparisonTable({ runs }: ComparisonTableProps) {
    if (runs.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Noch keine Evaluierungsdaten vorhanden.
            </p>
        )
    }

    // Find best values for highlighting
    const best = {
        avgSimilarity: Math.max(...runs.map(r => r.avgSimilarity ?? 0)),
        topKAccuracy1: Math.max(...runs.map(r => r.topKAccuracy1 ?? 0)),
        topKAccuracy3: Math.max(...runs.map(r => r.topKAccuracy3 ?? 0)),
        topKAccuracy5: Math.max(...runs.map(r => r.topKAccuracy5 ?? 0)),
        mrrScore: Math.max(...runs.map(r => r.mrrScore ?? 0)),
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Modell</TableHead>
                    <TableHead>Dimensionen</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Avg. Similarity</TableHead>
                    <TableHead className="text-right">Top-1</TableHead>
                    <TableHead className="text-right">Top-3</TableHead>
                    <TableHead className="text-right">Top-5</TableHead>
                    <TableHead className="text-right">MRR</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {runs.map(run => (
                    <TableRow key={run.modelId}>
                        <TableCell className="font-medium">{run.modelName}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{run.dimensions}d</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{run.provider}</Badge>
                        </TableCell>
                        <TableCell className={`text-right ${run.avgSimilarity === best.avgSimilarity ? 'font-bold text-green-500' : ''}`}>
                            {formatScore(run.avgSimilarity)}
                        </TableCell>
                        <TableCell className={`text-right ${run.topKAccuracy1 === best.topKAccuracy1 ? 'font-bold text-green-500' : ''}`}>
                            {formatPercent(run.topKAccuracy1)}
                        </TableCell>
                        <TableCell className={`text-right ${run.topKAccuracy3 === best.topKAccuracy3 ? 'font-bold text-green-500' : ''}`}>
                            {formatPercent(run.topKAccuracy3)}
                        </TableCell>
                        <TableCell className={`text-right ${run.topKAccuracy5 === best.topKAccuracy5 ? 'font-bold text-green-500' : ''}`}>
                            {formatPercent(run.topKAccuracy5)}
                        </TableCell>
                        <TableCell className={`text-right ${run.mrrScore === best.mrrScore ? 'font-bold text-green-500' : ''}`}>
                            {formatScore(run.mrrScore)}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
