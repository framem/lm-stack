'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ComparisonRun } from './ComparisonTable'
import { STRATEGY_LABELS, type ChunkStrategy } from '@/src/lib/chunking'

interface ComparisonChartProps {
    runs: ComparisonRun[]
}

const COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
]

/**
 * Build a display label for a run. When chunk config is present, include it.
 */
function runLabel(run: ComparisonRun): string {
    if (run.chunkSize != null) {
        const strategyShort = run.chunkStrategy && run.chunkStrategy !== 'sentence'
            ? ` ${STRATEGY_LABELS[run.chunkStrategy as ChunkStrategy]?.[0] ?? run.chunkStrategy[0].toUpperCase()}`
            : ''
        return `${run.modelName} (${run.chunkSize}t/${run.chunkOverlap ?? 0}o${strategyShort})`
    }
    return run.modelName
}

export function ComparisonChart({ runs }: ComparisonChartProps) {
    if (runs.length === 0) return null

    const hasNdcg = runs.some(r => r.ndcgScore != null)
    const labels = runs.map(runLabel)

    const data = [
        {
            metric: 'Avg. Similarity',
            ...Object.fromEntries(runs.map((r, i) => [labels[i], (r.avgSimilarity ?? 0) * 100])),
        },
        {
            metric: 'Top-1 Accuracy',
            ...Object.fromEntries(runs.map((r, i) => [labels[i], (r.topKAccuracy1 ?? 0) * 100])),
        },
        {
            metric: 'Top-3 Accuracy',
            ...Object.fromEntries(runs.map((r, i) => [labels[i], (r.topKAccuracy3 ?? 0) * 100])),
        },
        {
            metric: 'Top-5 Accuracy',
            ...Object.fromEntries(runs.map((r, i) => [labels[i], (r.topKAccuracy5 ?? 0) * 100])),
        },
        {
            metric: 'MRR',
            ...Object.fromEntries(runs.map((r, i) => [labels[i], (r.mrrScore ?? 0) * 100])),
        },
        ...(hasNdcg ? [{
            metric: 'nDCG',
            ...Object.fromEntries(runs.map((r, i) => [labels[i], (r.ndcgScore ?? 0) * 100])),
        }] : []),
    ]

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="metric" className="text-xs" />
                <YAxis className="text-xs" domain={[0, 100]} unit="%" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--card-foreground)',
                    }}
                    formatter={(value: number | undefined) => value != null ? `${value.toFixed(1)}%` : '—'}
                />
                <Legend />
                {labels.map((name, i) => (
                    <Bar
                        key={name}
                        dataKey={name}
                        fill={COLORS[i % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    )
}
