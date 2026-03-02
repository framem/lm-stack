'use client'

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
import { Badge } from '@/src/components/ui/badge'
import { Clock, Flame, TrendingDown, Brain } from 'lucide-react'
import type { DailyActivity, WeeklyTrend } from '@/src/data-access/stats'
import type { DailyLearningTime } from '@/src/data-access/learning-sessions'

// ── Types ──

interface HeatmapEntry {
    date: string
    count: number
}

interface RetentionEntry {
    daysSinceFirstReview: number
    retentionRate: number
    sampleSize: number
}

interface ForecastEntry {
    date: string
    count: number
}

interface DifficultWord {
    flashcardId: string
    front: string
    back: string
    againCount: number
    totalReviews: number
}

interface AnalyticsDashboardProps {
    learningTime: DailyLearningTime[]
    todayMinutes: number
    weeklyAvgMinutes: number
    reviewHeatmap: HeatmapEntry[]
    retentionCurve: RetentionEntry[]
    dueForecast: ForecastEntry[]
    difficultWords: DifficultWord[]
    dailyActivity: DailyActivity[]
    knowledgeTrend: WeeklyTrend[]
}

// ── Helpers ──

const ACTIVITY_LABELS: Record<string, string> = {
    flashcards: 'Karteikarten',
    vocabulary: 'Vokabeln',
    quiz: 'Quiz',
    reading: 'Lesen',
    chat: 'Chat',
}

const ACTIVITY_COLORS: Record<string, string> = {
    flashcards: 'hsl(220, 70%, 55%)',
    vocabulary: 'hsl(280, 60%, 55%)',
    quiz: 'hsl(142, 71%, 45%)',
    reading: 'hsl(35, 80%, 55%)',
    chat: 'hsl(0, 70%, 55%)',
}

function getHeatmapColor(count: number): string {
    if (count === 0) return 'hsl(var(--muted))'
    if (count <= 2) return 'hsl(220, 70%, 75%)'
    if (count <= 5) return 'hsl(220, 70%, 55%)'
    if (count <= 10) return 'hsl(220, 70%, 40%)'
    return 'hsl(220, 70%, 30%)'
}

function formatDateShort(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getDate()}.${d.getMonth() + 1}.`
}

// ── Sub-components ──

function LearningTimeChart({ data, todayMinutes, weeklyAvgMinutes }: {
    data: DailyLearningTime[]
    todayMinutes: number
    weeklyAvgMinutes: number
}) {
    // Show last 14 days
    const recent = data.slice(-14)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Lernzeit
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                            <span className="font-semibold">{todayMinutes} min</span>
                            <span className="text-muted-foreground">heute</span>
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                            <span className="font-semibold">{weeklyAvgMinutes} min</span>
                            <span className="text-muted-foreground">⌀/Tag</span>
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {recent.every(d => d.minutes === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Noch keine Lernzeit erfasst. Starte eine Lern-Session!
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={recent} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                tickFormatter={formatDateShort}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                tickFormatter={(v) => `${v}m`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    color: 'hsl(var(--popover-foreground))',
                                }}
                                formatter={(value) => [`${value} min`, 'Lernzeit']}
                                labelFormatter={(label) => {
                                    const d = new Date(label)
                                    return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
                                }}
                            />
                            <Bar dataKey="minutes" fill="hsl(220, 70%, 55%)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
                {/* Activity type legend */}
                {recent.some(d => d.minutes > 0) && (
                    <div className="flex flex-wrap gap-3 mt-3">
                        {Object.entries(
                            recent.reduce((acc, d) => {
                                for (const [type, mins] of Object.entries(d.byActivity)) {
                                    acc[type] = (acc[type] ?? 0) + mins
                                }
                                return acc
                            }, {} as Record<string, number>)
                        )
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, totalMins]) => (
                            <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <div
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: ACTIVITY_COLORS[type] ?? 'hsl(var(--muted-foreground))' }}
                                />
                                <span>{ACTIVITY_LABELS[type] ?? type}: {totalMins} min</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function ReviewHeatmap({ data }: { data: HeatmapEntry[] }) {
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
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    Review-Aktivität (26 Wochen)
                </CardTitle>
            </CardHeader>
            <CardContent>
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
    )
}

function RetentionCurve({ data }: { data: RetentionEntry[] }) {
    if (data.length === 0) return null
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Retention-Kurve
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
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
    )
}

function DueForecast({ data }: { data: ForecastEntry[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Fälligkeits-Vorhersage (14 Tage)</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            tickFormatter={formatDateShort}
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
                        <Bar dataKey="count" fill="hsl(35, 80%, 55%)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

function DifficultWords({ data }: { data: DifficultWord[] }) {
    if (data.length === 0) return null
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Schwierige Wörter
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {data.slice(0, 10).map((word) => {
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
    )
}

function KnowledgeTrend({ data }: { data: WeeklyTrend[] }) {
    if (data.length === 0) return null
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Wissens-Trend</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="week"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickFormatter={(v) => `KW ${v.split('-')[1]}`}
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
                            formatter={(value) => [`${value}%`, 'Wissensstand']}
                            labelFormatter={(label) => `KW ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="avgScore"
                            stroke="hsl(142, 71%, 45%)"
                            fill="hsl(142, 71%, 45%)"
                            fillOpacity={0.15}
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

// ── Main component ──

export function AnalyticsDashboard({
    learningTime,
    todayMinutes,
    weeklyAvgMinutes,
    reviewHeatmap,
    retentionCurve,
    dueForecast,
    difficultWords,
    knowledgeTrend,
}: AnalyticsDashboardProps) {
    return (
        <div className="space-y-6">
            <LearningTimeChart
                data={learningTime}
                todayMinutes={todayMinutes}
                weeklyAvgMinutes={weeklyAvgMinutes}
            />
            <ReviewHeatmap data={reviewHeatmap} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RetentionCurve data={retentionCurve} />
                <KnowledgeTrend data={knowledgeTrend} />
            </div>
            <DueForecast data={dueForecast} />
            <DifficultWords data={difficultWords} />
        </div>
    )
}
