'use client'

import Link from 'next/link'
import {
    Target,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import type {
    CompetencyScore,
    LearningRecommendation,
    AdaptiveLearningData,
} from '@/src/data-access/adaptive-learning'

interface AdaptiveLearningPanelProps {
    data: AdaptiveLearningData
}

// ── Score color helpers ──

function scoreColor(score: number) {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
}

function barColor(score: number) {
    if (score >= 80) return 'bg-green-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
}

function priorityBadge(priority: LearningRecommendation['priority']) {
    switch (priority) {
        case 'high':
            return <Badge variant="destructive" className="text-xs">Priorität</Badge>
        case 'medium':
            return <Badge variant="secondary" className="text-xs">Empfohlen</Badge>
        case 'low':
            return <Badge variant="outline" className="text-xs">Optional</Badge>
    }
}

function TrendIcon({ trend }: { trend: CompetencyScore['trend'] }) {
    switch (trend) {
        case 'up':
            return <TrendingUp className="h-3 w-3 text-green-500" />
        case 'down':
            return <TrendingDown className="h-3 w-3 text-red-500" />
        case 'stable':
            return <Minus className="h-3 w-3 text-muted-foreground" />
    }
}

// ── Main panel ──

export function AdaptiveLearningPanel({ data }: AdaptiveLearningPanelProps) {
    const { competencies, recommendations, overallLevel } = data
    const hasData = competencies.some((c) => c.sampleSize > 0)

    return (
        <div className="space-y-4">
            {/* Overall level estimate */}
            <Card>
                <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">Geschätztes Niveau</p>
                            <p className="text-sm text-muted-foreground">
                                {hasData
                                    ? 'Basierend auf deinen bisherigen Übungen'
                                    : 'Starte Übungen, um dein Niveau zu ermitteln'
                                }
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-lg px-3 py-1 font-bold">
                        {overallLevel}
                    </Badge>
                </CardContent>
            </Card>

            {/* Competency bars */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Kompetenzprofil</CardTitle>
                    <CardDescription>
                        Deine Stärken und Schwächen auf einen Blick
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {competencies.map((comp) => (
                        <div key={comp.area} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{comp.label}</span>
                                    <TrendIcon trend={comp.trend} />
                                </div>
                                <div className="flex items-center gap-2">
                                    {comp.sampleSize === 0 ? (
                                        <span className="text-xs text-muted-foreground">Keine Daten</span>
                                    ) : (
                                        <>
                                            <span className={`font-bold ${scoreColor(comp.score)}`}>
                                                {comp.score}%
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                ({comp.sampleSize})
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        comp.sampleSize === 0 ? 'bg-muted-foreground/20' : barColor(comp.score)
                                    }`}
                                    style={{ width: comp.sampleSize === 0 ? '0%' : `${comp.score}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Empfohlene nächste Schritte</CardTitle>
                        <CardDescription>
                            Personalisierte Übungsvorschläge basierend auf deinem Profil
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recommendations.map((rec, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-3 rounded-lg border p-3"
                            >
                                <div className="mt-0.5">
                                    {rec.priority === 'high' ? (
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                    ) : rec.priority === 'low' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Target className="h-4 w-4 text-yellow-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{rec.label}</span>
                                        {priorityBadge(rec.priority)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{rec.message}</p>
                                </div>
                                <Button size="sm" variant="outline" asChild className="shrink-0">
                                    <Link href={rec.action}>
                                        {rec.actionLabel}
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
