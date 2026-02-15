'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ComparisonRun {
    modelName: string
    avgSimilarity: number | null
    topKAccuracy1: number | null
    topKAccuracy3: number | null
    topKAccuracy5: number | null
    mrrScore: number | null
}

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

export function ComparisonChart({ runs }: ComparisonChartProps) {
    if (runs.length === 0) return null

    const data = [
        {
            metric: 'Avg. Similarity',
            ...Object.fromEntries(runs.map(r => [r.modelName, r.avgSimilarity ?? 0])),
        },
        {
            metric: 'Top-1 Accuracy',
            ...Object.fromEntries(runs.map(r => [r.modelName, (r.topKAccuracy1 ?? 0) * 100])),
        },
        {
            metric: 'Top-3 Accuracy',
            ...Object.fromEntries(runs.map(r => [r.modelName, (r.topKAccuracy3 ?? 0) * 100])),
        },
        {
            metric: 'Top-5 Accuracy',
            ...Object.fromEntries(runs.map(r => [r.modelName, (r.topKAccuracy5 ?? 0) * 100])),
        },
        {
            metric: 'MRR',
            ...Object.fromEntries(runs.map(r => [r.modelName, (r.mrrScore ?? 0) * 100])),
        },
    ]

    const modelNames = runs.map(r => r.modelName)

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="metric" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--card-foreground)',
                    }}
                />
                <Legend />
                {modelNames.map((name, i) => (
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
