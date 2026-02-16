'use client'

import { useMemo } from 'react'
import {
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
    ComposedChart,
} from 'recharts'
import { STRATEGY_LABELS, type ChunkStrategy } from '@/src/lib/chunking'

export interface ParetoPoint {
    runId: string
    modelName: string
    dimensions: number
    chunkSize: number | null
    chunkOverlap: number | null
    chunkStrategy: string | null
    quality: number   // 0-1 scale
    latency: number   // ms
    isPareto: boolean
    label: string
}

interface ParetoChartProps {
    points: ParetoPoint[]
    qualityMetric: string
    onMetricChange: (metric: string) => void
}

const METRIC_OPTIONS = ['Top-1', 'MRR', 'nDCG'] as const

const MODEL_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
]

/**
 * Compute the Pareto front from a set of points.
 * A point is Pareto-optimal if no other point has both lower latency AND higher quality.
 */
function computeParetoFront(points: ParetoPoint[]): ParetoPoint[] {
    const sorted = [...points].sort((a, b) => a.latency - b.latency)
    const front: ParetoPoint[] = []
    let maxQuality = -Infinity

    for (const point of sorted) {
        if (point.quality > maxQuality) {
            front.push(point)
            maxQuality = point.quality
        }
    }

    return front
}

/**
 * Custom shape renderer for scatter points.
 * Different shapes per chunking strategy.
 */
function StrategyShape(props: {
    cx?: number
    cy?: number
    payload?: ParetoPoint
    fill?: string
}) {
    const { cx = 0, cy = 0, payload, fill } = props
    if (!payload) return null

    const isPareto = payload.isPareto
    const size = isPareto ? 8 : 6
    const opacity = isPareto ? 1 : 0.4
    const strokeWidth = isPareto ? 2 : 1

    const strategy = payload.chunkStrategy

    // Circle for sentence (default), square for paragraph, triangle for recursive, diamond for semantic
    if (strategy === 'paragraph') {
        return (
            <rect
                x={cx - size}
                y={cy - size}
                width={size * 2}
                height={size * 2}
                fill={isPareto ? fill : 'transparent'}
                stroke={fill}
                strokeWidth={strokeWidth}
                opacity={opacity}
            />
        )
    }
    if (strategy === 'recursive') {
        const points = `${cx},${cy - size * 1.2} ${cx - size},${cy + size * 0.8} ${cx + size},${cy + size * 0.8}`
        return (
            <polygon
                points={points}
                fill={isPareto ? fill : 'transparent'}
                stroke={fill}
                strokeWidth={strokeWidth}
                opacity={opacity}
            />
        )
    }
    if (strategy === 'semantic') {
        const points = `${cx},${cy - size * 1.2} ${cx + size},${cy} ${cx},${cy + size * 1.2} ${cx - size},${cy}`
        return (
            <polygon
                points={points}
                fill={isPareto ? fill : 'transparent'}
                stroke={fill}
                strokeWidth={strokeWidth}
                opacity={opacity}
            />
        )
    }

    // Default: circle (sentence or null strategy)
    return (
        <circle
            cx={cx}
            cy={cy}
            r={size}
            fill={isPareto ? fill : 'transparent'}
            stroke={fill}
            strokeWidth={strokeWidth}
            opacity={opacity}
        />
    )
}

/**
 * Custom tooltip for scatter points
 */
function ParetoTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ParetoPoint }> }) {
    if (!active || !payload || payload.length === 0) return null

    const point = payload[0].payload
    const strategyLabel = point.chunkStrategy
        ? STRATEGY_LABELS[point.chunkStrategy as ChunkStrategy] ?? point.chunkStrategy
        : '—'

    return (
        <div
            className="rounded-md border p-3 text-sm shadow-md"
            style={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                color: 'var(--card-foreground)',
            }}
        >
            <p className="font-semibold">{point.modelName}</p>
            <p className="text-xs text-muted-foreground">{point.dimensions}d</p>
            <div className="mt-1.5 space-y-0.5 text-xs">
                <p>Qualität: {(point.quality * 100).toFixed(1)}%</p>
                <p>Latenz: {point.latency} ms</p>
                {point.chunkSize != null && (
                    <p>Chunk: {point.chunkSize}t / {point.chunkOverlap ?? 0}o</p>
                )}
                <p>Strategie: {strategyLabel}</p>
                {point.isPareto && (
                    <p className="font-semibold text-green-600 dark:text-green-400 mt-1">
                        Pareto-optimal
                    </p>
                )}
            </div>
        </div>
    )
}

export function ParetoChart({ points, qualityMetric, onMetricChange }: ParetoChartProps) {
    // Hooks must be called unconditionally (Rules of Hooks)
    const paretoFrontIds = useMemo(() => {
        if (points.length === 0) return new Set<string>()
        const front = computeParetoFront(points)
        return new Set(front.map(p => p.runId))
    }, [points])

    const enrichedPoints = useMemo(() =>
        points.map(p => ({
            ...p,
            isPareto: paretoFrontIds.has(p.runId),
            qualityPercent: +(p.quality * 100).toFixed(1),
        })),
        [points, paretoFrontIds]
    )

    // Pareto front line data (sorted by latency)
    const frontLine = useMemo(() =>
        enrichedPoints
            .filter(p => p.isPareto)
            .sort((a, b) => a.latency - b.latency)
            .map(p => ({ latency: p.latency, qualityPercent: p.qualityPercent })),
        [enrichedPoints]
    )

    // Group by model for coloring
    const modelNames = useMemo(() =>
        [...new Set(points.map(p => p.modelName))],
        [points]
    )

    const groupedByModel = useMemo(() => {
        const groups: Record<string, typeof enrichedPoints> = {}
        for (const p of enrichedPoints) {
            if (!groups[p.modelName]) groups[p.modelName] = []
            groups[p.modelName].push(p)
        }
        return groups
    }, [enrichedPoints])

    // Early return after all hooks
    if (points.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-8 text-center">
                Keine Datenpunkte mit Latenz-Informationen vorhanden.
                Führe zuerst ein Embedding durch, um Latenz-Daten zu erfassen.
            </p>
        )
    }

    return (
        <div className="space-y-4">
            {/* Metric selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Qualitätsmetrik:</label>
                <select
                    value={qualityMetric}
                    onChange={e => onMetricChange(e.target.value)}
                    className="rounded-md border px-3 py-1.5 text-sm bg-background"
                >
                    {METRIC_OPTIONS.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            {/* Legend for shapes */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="currentColor" /></svg>
                    Satzgrenzen
                </span>
                <span className="flex items-center gap-1">
                    <svg width="12" height="12"><rect x="2" y="2" width="8" height="8" fill="currentColor" /></svg>
                    Absatzgrenzen
                </span>
                <span className="flex items-center gap-1">
                    <svg width="12" height="12"><polygon points="6,1 2,10 10,10" fill="currentColor" /></svg>
                    Rekursiv
                </span>
                <span className="flex items-center gap-1">
                    <svg width="12" height="12"><polygon points="6,1 11,6 6,11 1,6" fill="currentColor" /></svg>
                    Semantisch
                </span>
                <span className="flex items-center gap-1 ml-2 border-l pl-2">
                    <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="currentColor" /></svg>
                    Pareto-optimal
                </span>
                <span className="flex items-center gap-1">
                    <svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="transparent" stroke="currentColor" strokeWidth="1" opacity="0.4" /></svg>
                    Dominiert
                </span>
            </div>

            <ResponsiveContainer width="100%" height={450}>
                <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                        dataKey="latency"
                        type="number"
                        name="Latenz"
                        unit=" ms"
                        className="text-xs"
                        label={{ value: 'Latenz (ms)', position: 'insideBottom', offset: -10, className: 'text-xs fill-muted-foreground' }}
                    />
                    <YAxis
                        dataKey="qualityPercent"
                        type="number"
                        name="Qualität"
                        unit="%"
                        domain={[0, 100]}
                        className="text-xs"
                        label={{ value: `${qualityMetric} (%)`, angle: -90, position: 'insideLeft', offset: 10, className: 'text-xs fill-muted-foreground' }}
                    />
                    <Tooltip content={<ParetoTooltip />} />

                    {/* Pareto front line */}
                    <Line
                        data={frontLine}
                        dataKey="qualityPercent"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={false}
                        name="Pareto-Front"
                        legendType="line"
                    />

                    {/* Scatter groups by model */}
                    {modelNames.map((name, i) => (
                        <Scatter
                            key={name}
                            name={name}
                            data={groupedByModel[name]}
                            fill={MODEL_COLORS[i % MODEL_COLORS.length]}
                            shape={<StrategyShape />}
                        />
                    ))}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}
