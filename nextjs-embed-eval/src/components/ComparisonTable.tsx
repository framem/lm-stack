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
import { STRATEGY_LABELS, type ChunkStrategy } from '@/src/lib/chunking'

export interface ComparisonRun {
    id?: string
    modelId: string
    modelName: string
    dimensions: number
    provider: string
    avgSimilarity: number | null
    topKAccuracy1: number | null
    topKAccuracy3: number | null
    topKAccuracy5: number | null
    mrrScore: number | null
    ndcgScore?: number | null
    chunkSize?: number | null
    chunkOverlap?: number | null
    chunkStrategy?: string | null
    totalPhrases?: number | null
    lastEmbedDurationMs?: number | null
    createdAt?: string | Date
}

interface ComparisonTableProps {
    runs: ComparisonRun[]
    showChunkConfig?: boolean
}

function formatPercent(value: number | null): string {
    if (value === null || value === undefined) return '—'
    return `${(value * 100).toFixed(1)}%`
}

function formatScore(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—'
    return value.toFixed(4)
}

export function ComparisonTable({ runs, showChunkConfig = false }: ComparisonTableProps) {
    if (runs.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Noch keine Evaluierungsdaten vorhanden.
            </p>
        )
    }

    // Detect if any run has chunk config data
    const hasChunkData = showChunkConfig || runs.some(r => r.chunkSize != null)
    const hasNdcg = runs.some(r => r.ndcgScore != null)

    // Find best values for highlighting
    const best = {
        avgSimilarity: Math.max(...runs.map(r => r.avgSimilarity ?? 0)),
        topKAccuracy1: Math.max(...runs.map(r => r.topKAccuracy1 ?? 0)),
        topKAccuracy3: Math.max(...runs.map(r => r.topKAccuracy3 ?? 0)),
        topKAccuracy5: Math.max(...runs.map(r => r.topKAccuracy5 ?? 0)),
        mrrScore: Math.max(...runs.map(r => r.mrrScore ?? 0)),
        ndcgScore: Math.max(...runs.map(r => r.ndcgScore ?? 0)),
    }

    const isBest = (value: number | null | undefined, bestValue: number) =>
        value != null && value === bestValue && runs.length > 1

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Modell</TableHead>
                        {hasChunkData && <TableHead>Chunk-Config</TableHead>}
                        <TableHead>Dim.</TableHead>
                        <TableHead className="text-right">Avg. Sim.</TableHead>
                        <TableHead className="text-right">Top-1</TableHead>
                        <TableHead className="text-right">Top-3</TableHead>
                        <TableHead className="text-right">Top-5</TableHead>
                        <TableHead className="text-right">MRR</TableHead>
                        {hasNdcg && <TableHead className="text-right">nDCG</TableHead>}
                        {hasChunkData && <TableHead className="text-right text-xs">Phrasen</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {runs.map((run, idx) => (
                        <TableRow key={run.id ?? `${run.modelId}-${idx}`}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {run.modelName}
                                    <Badge variant="secondary" className="text-xs">{run.provider}</Badge>
                                </div>
                            </TableCell>
                            {hasChunkData && (
                                <TableCell>
                                    {run.chunkSize != null ? (
                                        <span className="text-xs font-mono">
                                            {run.chunkSize}t / {run.chunkOverlap ?? 0}o
                                            {run.chunkStrategy && run.chunkStrategy !== 'sentence' && (
                                                <span className="ml-1 text-muted-foreground">
                                                    ({STRATEGY_LABELS[run.chunkStrategy as ChunkStrategy] ?? run.chunkStrategy})
                                                </span>
                                            )}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                            )}
                            <TableCell>
                                <Badge variant="outline" className="text-xs">{run.dimensions}d</Badge>
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm ${isBest(run.avgSimilarity, best.avgSimilarity) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                {formatScore(run.avgSimilarity)}
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm ${isBest(run.topKAccuracy1, best.topKAccuracy1) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                {formatPercent(run.topKAccuracy1)}
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm ${isBest(run.topKAccuracy3, best.topKAccuracy3) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                {formatPercent(run.topKAccuracy3)}
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm ${isBest(run.topKAccuracy5, best.topKAccuracy5) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                {formatPercent(run.topKAccuracy5)}
                            </TableCell>
                            <TableCell className={`text-right font-mono text-sm ${isBest(run.mrrScore, best.mrrScore) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                {formatScore(run.mrrScore)}
                            </TableCell>
                            {hasNdcg && (
                                <TableCell className={`text-right font-mono text-sm ${isBest(run.ndcgScore, best.ndcgScore) ? 'font-bold text-green-600 dark:text-green-400' : ''}`}>
                                    {formatScore(run.ndcgScore)}
                                </TableCell>
                            )}
                            {hasChunkData && (
                                <TableCell className="text-right text-xs text-muted-foreground">
                                    {run.totalPhrases ?? '—'}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
