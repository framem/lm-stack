'use client'

import {useRouter} from 'next/navigation'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import {Card, CardContent, CardHeader, CardTitle} from '@/src/components/ui/card'
import {Button} from '@/src/components/ui/button'
import {GraduationCap, HelpCircle, Layers, RotateCcw} from 'lucide-react'
import Link from 'next/link'

interface DocumentProgress {
    documentId: string
    documentTitle: string
    percentage: number
    answeredQuestions: number
    totalQuestions: number
}

interface LearningProgressProps {
    progress: DocumentProgress[]
    dueQuizReviews: number
    dueFlashcardReviews: number
    totalFlashcards: number
}

// Color coding by progress tier
function getProgressColor(percentage: number): string {
    if (percentage >= 70) return 'hsl(142, 71%, 45%)' // green
    if (percentage >= 40) return 'hsl(38, 92%, 50%)'  // amber
    return 'hsl(0, 84%, 60%)'                         // red
}

// Custom tooltip with enriched info
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartEntry }> }) {
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
            <p className="font-medium mb-1">{data.fullName}</p>
            <p>Wissensstand: <span className="font-semibold">{data.Wissen}%</span></p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {data.answered} von {data.total} bearbeitet
            </p>
        </div>
    )
}

interface ChartEntry {
    name: string
    fullName: string
    Wissen: number
    documentId: string
    answered: number
    total: number
}

export function LearningProgress({
    progress,
    dueQuizReviews,
    dueFlashcardReviews,
    totalFlashcards,
}: LearningProgressProps) {
    const router = useRouter()
    const totalDue = dueQuizReviews + dueFlashcardReviews

    // Prepare chart data — sort ascending (weakest on top) and truncate long titles
    const chartData: ChartEntry[] = progress
        .slice()
        .sort((a, b) => a.percentage - b.percentage)
        .map((p) => ({
            name: p.documentTitle.length > 25
                ? p.documentTitle.slice(0, 23) + '...'
                : p.documentTitle,
            fullName: p.documentTitle,
            Wissen: p.percentage,
            documentId: p.documentId,
            answered: p.answeredQuestions,
            total: p.totalQuestions,
        }))

    const chartHeight = Math.min(400, Math.max(160, chartData.length * 40))

    return (
        <div className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
                            <RotateCcw className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalDue}</p>
                            <p className="text-xs text-muted-foreground">Fällige Wiederholungen</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                            <Layers className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalFlashcards}</p>
                            <p className="text-xs text-muted-foreground">Karteikarten</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                            <GraduationCap className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {progress.length > 0
                                    ? Math.round(progress.reduce((s, p) => s + p.percentage, 0) / progress.length)
                                    : 0} %
                            </p>
                            <p className="text-xs text-muted-foreground">Durchschn. Wissensstand</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bar chart or empty state */}
            {chartData.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Wissensstand pro Lernmaterial</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
                            <ResponsiveContainer width="100%" height={chartHeight}>
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ left: 8, right: 40, top: 0, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        horizontal={false}
                                        stroke="hsl(var(--border))"
                                    />
                                    <XAxis
                                        type="number"
                                        domain={[0, 100]}
                                        tickFormatter={(v) => `${v}%`}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={140}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine
                                        x={80}
                                        stroke="hsl(142, 71%, 45%)"
                                        strokeDasharray="5 5"
                                        label={{ value: 'Ziel', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    />
                                    <Bar
                                        dataKey="Wissen"
                                        radius={[0, 4, 4, 0]}
                                        maxBarSize={24}
                                        cursor="pointer"
                                        onClick={(_data, _index) => {
                                            const entry = chartData[_index]
                                            if (entry?.documentId) {
                                                router.push(`/learn/documents/${entry.documentId}`)
                                            }
                                        }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={index} fill={getProgressColor(entry.Wissen)} />
                                        ))}
                                        <LabelList
                                            dataKey="Wissen"
                                            position="right"
                                            formatter={(v) => `${v}%`}
                                            style={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="p-3 rounded-full bg-muted mb-3">
                            <HelpCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Noch kein Lernfortschritt vorhanden. Starte ein Quiz oder lerne Karteikarten,
                            um deinen Wissensstand zu sehen.
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/learn/quiz">Quiz starten</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/learn/flashcards">Karteikarten lernen</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
