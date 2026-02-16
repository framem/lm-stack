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
import type { DailyActivity, WeeklyTrend, SubjectDistribution } from '@/src/data-access/stats'

interface StatsChartsProps {
    dailyActivity: DailyActivity[]
    knowledgeTrend: WeeklyTrend[]
    subjectDistribution: SubjectDistribution[]
}

// Color intensity for heatmap (0-4 scale)
function getHeatmapColor(count: number): string {
    if (count === 0) return 'hsl(var(--muted))'
    if (count <= 2) return 'hsl(142, 71%, 75%)'
    if (count <= 5) return 'hsl(142, 71%, 55%)'
    if (count <= 10) return 'hsl(142, 71%, 40%)'
    return 'hsl(142, 71%, 30%)'
}

function KnowledgeTrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: WeeklyTrend }> }) {
    if (!active || !payload?.length) return null
    const data = payload[0].payload
    return (
        <div
            className="rounded-md border px-3 py-2 text-sm shadow-md"
            style={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--popover-foreground))',
            }}
        >
            <p className="font-medium">KW {data.week}</p>
            <p>Wissensstand: <span className="font-semibold">{data.avgScore}%</span></p>
        </div>
    )
}

function LearningHeatmap({ dailyActivity }: { dailyActivity: DailyActivity[] }) {
    // Build a 13-week × 7-day grid
    const today = new Date()
    const activityMap = new Map(dailyActivity.map((d) => [d.date, d.total]))

    const cells: { date: string; count: number; col: number; row: number }[] = []

    for (let week = 12; week >= 0; week--) {
        for (let day = 0; day < 7; day++) {
            const d = new Date(today)
            d.setDate(d.getDate() - (week * 7 + (today.getDay() - day)))
            const dateStr = d.toISOString().split('T')[0]
            cells.push({
                date: dateStr,
                count: activityMap.get(dateStr) || 0,
                col: 12 - week,
                row: day,
            })
        }
    }

    const dayLabels = ['Mo', '', 'Mi', '', 'Fr', '', 'So']

    return (
        <div className="flex gap-1.5">
            <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-1">
                {dayLabels.map((label, i) => (
                    <div key={i} className="h-3 flex items-center">{label}</div>
                ))}
            </div>
            <div
                className="grid gap-1"
                style={{
                    gridTemplateColumns: 'repeat(13, 1fr)',
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
                        title={`${cell.date}: ${cell.count} Aktivitäten`}
                    />
                ))}
            </div>
        </div>
    )
}

export function StatsCharts({
    dailyActivity,
    knowledgeTrend,
    subjectDistribution,
}: StatsChartsProps) {
    return (
        <div className="space-y-6">
            {/* Knowledge Trend */}
            {knowledgeTrend.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Wissens-Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={knowledgeTrend} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
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
                                <Tooltip content={<KnowledgeTrendTooltip />} />
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
            )}

            {/* Learning Heatmap */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Lern-Aktivität (letzte 13 Wochen)</CardTitle>
                </CardHeader>
                <CardContent>
                    <LearningHeatmap dailyActivity={dailyActivity} />
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

            {/* Subject Distribution */}
            {subjectDistribution.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Fach-Verteilung</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={Math.max(200, subjectDistribution.length * 50)}>
                            <BarChart
                                data={subjectDistribution}
                                layout="vertical"
                                margin={{ left: 8, right: 24, top: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    type="number"
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="subject"
                                    width={120}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--popover-foreground))',
                                    }}
                                />
                                <Bar dataKey="documents" name="Lernmaterial" fill="hsl(220, 70%, 55%)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                <Bar dataKey="quizzes" name="Quizze" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                <Bar dataKey="flashcards" name="Karteikarten" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} maxBarSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
