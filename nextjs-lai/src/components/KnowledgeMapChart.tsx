'use client'

import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
} from 'recharts'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import type { TopicCompetency } from '@/src/data-access/topics'

interface KnowledgeMapChartProps {
    competencies: TopicCompetency[]
}

function statusColor(status: TopicCompetency['status']) {
    switch (status) {
        case 'Beherrscht':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        case 'Teilweise':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        case 'Lücke':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
}

export function KnowledgeMapChart({ competencies }: KnowledgeMapChartProps) {
    if (competencies.length === 0) {
        return (
            <p className="text-muted-foreground text-center py-8">
                Noch keine Themen extrahiert. Extrahiere zuerst Themen aus einem Dokument.
            </p>
        )
    }

    const data = competencies.map((c) => ({
        subject: c.name.length > 20 ? c.name.slice(0, 18) + '...' : c.name,
        score: c.score,
        fullMark: 100,
    }))

    return (
        <div className="space-y-6">
            {/* Radar Chart */}
            {competencies.length >= 3 && (
                <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Radar
                                name="Kompetenz"
                                dataKey="score"
                                stroke="hsl(var(--primary))"
                                fill="hsl(var(--primary))"
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Topic detail cards */}
            <div className="grid gap-3 md:grid-cols-2">
                {competencies.map((c) => (
                    <Card key={c.id}>
                        <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-sm">{c.name}</h3>
                                <Badge className={statusColor(c.status)} variant="outline">
                                    {c.status}
                                </Badge>
                            </div>
                            {c.description && (
                                <p className="text-xs text-muted-foreground">{c.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground text-lg">{c.score}%</span>
                                {c.quizScore !== null && <span>Quiz: {c.quizScore}%</span>}
                                {c.flashcardScore !== null && <span>Karten: {c.flashcardScore}%</span>}
                                <span>{c.chunkCount} Abschnitte</span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        c.score >= 80
                                            ? 'bg-green-500'
                                            : c.score >= 40
                                              ? 'bg-yellow-500'
                                              : 'bg-red-500'
                                    }`}
                                    style={{ width: `${c.score}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
