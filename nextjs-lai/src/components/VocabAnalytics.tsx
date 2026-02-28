'use client'

import { useState, useEffect } from 'react'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Loader2 } from 'lucide-react'
import {
    fetchVocabReviewHeatmap,
    fetchRetentionCurve,
    fetchDifficultWords,
    fetchDueForecast,
} from '@/src/actions/vocab-stats'

// Color intensity for heatmap (0-4 scale)
function getHeatmapColor(count: number): string {
    if (count === 0) return 'hsl(var(--muted))'
    if (count <= 2) return 'hsl(220, 70%, 75%)'
    if (count <= 5) return 'hsl(220, 70%, 55%)'
    if (count <= 10) return 'hsl(220, 70%, 40%)'
    return 'hsl(220, 70%, 30%)'
}

function ReviewHeatmap({ data }: { data: { date: string; count: number }[] }) {
    const today = new Date()
    const activityMap = new Map(data.map((d) => [d.date, d.count]))

    const cells: { date: string; count: number; col: number; row: number }[] = []
    for (let week = 25; week >= 0; week--) {
        for (let day = 0; day < 7; day++) {
            const d = new Date(today)
            d.setDate(d.getDate() - (week * 7 + (today.getDay() - day)))
            const dateStr = d.toISOString().split('T')[0]
            cells.push({
                date: dateStr,
                count: activityMap.get(dateStr) || 0,
                col: 25 - week,
                row: day,
            })
        }
    }

    const dayLabels = ['Mo', '', 'Mi', '', 'Fr', '', 'So']

    return (
        <div className="flex gap-1.5 overflow-x-auto">
            <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-1 shrink-0">
                {dayLabels.map((label, i) => (
                    <div key={i} className="h-3 flex items-center">{label}</div>
                ))}
            </div>
            <div
                className="grid gap-1"
                style={{
                    gridTemplateColumns: 'repeat(26, 1fr)',
                    gridTemplateRows: 'repeat(7, 1fr)',
                }}
            >
                {cells.map((cell) => (
                    <div
                        key={cell.date}
                        className="h-3 w-3 rounded-sm"
                        style={{
                            backgroundColor: getHeatmapColor(cell.count),
                            gridColumn: cell.col + 1,
                            gridRow: cell.row + 1,
                        }}
                        title={`${cell.date}: ${cell.count} Reviews`}
                    />
                ))}
            </div>
        </div>
    )
}

export function VocabAnalytics() {
    const [heatmap, setHeatmap] = useState<{ date: string; count: number }[] | null>(null)
    const [retention, setRetention] = useState<{ daysSinceFirstReview: number; retentionRate: number; sampleSize: number }[] | null>(null)
    const [forecast, setForecast] = useState<{ date: string; count: number }[] | null>(null)
    const [difficult, setDifficult] = useState<{ flashcardId: string; front: string; back: string; againCount: number; totalReviews: number }[] | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetchVocabReviewHeatmap(),
            fetchRetentionCurve(),
            fetchDueForecast(),
            fetchDifficultWords(),
        ]).then(([h, r, f, d]) => {
            setHeatmap(h)
            setRetention(r)
            setForecast(f)
            setDifficult(d)
        }).catch(console.error)
        .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Review Heatmap */}
            {heatmap && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Review-Aktivität (26 Wochen)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReviewHeatmap data={heatmap} />
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <span>Weniger</span>
                            {[0, 2, 5, 10, 15].map((n) => (
                                <div
                                    key={n}
                                    className="h-3 w-3 rounded-sm"
                                    style={{ backgroundColor: getHeatmapColor(n) }}
                                />
                            ))}
                            <span>Mehr</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Retention Curve */}
            {retention && retention.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Retention-Kurve</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={retention} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="daysSinceFirstReview"
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    label={{ value: 'Tage', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tickFormatter={(v) => `${v}%`}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--popover-foreground))',
                                    }}
                                    formatter={(value) => [`${value}%`, 'Retention']}
                                    labelFormatter={(label) => `Tag ${label}`}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="retentionRate"
                                    stroke="hsl(142, 71%, 45%)"
                                    fill="hsl(142, 71%, 45%)"
                                    fillOpacity={0.15}
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Due Forecast */}
            {forecast && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Fälligkeits-Vorhersage (14 Tage)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={forecast} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                    tickFormatter={(v) => {
                                        const d = new Date(v)
                                        return `${d.getDate()}.${d.getMonth() + 1}.`
                                    }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--popover-foreground))',
                                    }}
                                    formatter={(value) => [value, 'Fällige Karten']}
                                    labelFormatter={(label) => {
                                        const d = new Date(label)
                                        return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
                                    }}
                                />
                                <Bar dataKey="count" fill="hsl(220, 70%, 55%)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Difficult Words */}
            {difficult && difficult.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Schwierige Wörter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {difficult.slice(0, 10).map((word) => {
                                const againRate = word.totalReviews > 0
                                    ? Math.round((word.againCount / word.totalReviews) * 100)
                                    : 0
                                return (
                                    <div
                                        key={word.flashcardId}
                                        className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <span className="font-medium">{word.front}</span>
                                            <span className="text-muted-foreground"> — {word.back}</span>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                                            <span className="text-red-600 font-medium">{againRate}% Nochmal</span>
                                            <span>{word.totalReviews} Reviews</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
