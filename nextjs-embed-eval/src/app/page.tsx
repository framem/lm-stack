export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Navigation } from '@/src/components/Navigation'
import { MetricCard } from '@/src/components/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { prisma } from '@/src/lib/prisma'
import { getSourceTexts } from '@/src/data-access/source-texts'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'
import { getTestPhrases } from '@/src/data-access/test-phrases'
import { getLatestEvalRuns } from '@/src/data-access/evaluation'
import { formatDateTime } from '@/src/lib/utils'
import {
    BookText, Brain, MessageSquare, FlaskConical, BarChart3,
    GitCompare, CheckCircle2, Circle, Sparkles,
} from 'lucide-react'

// Setup step definition
interface SetupStep {
    label: string
    href: string
    icon: React.ReactNode
    done: boolean
}

export default async function DashboardPage() {
    // Fetch display data and counts in parallel
    const [
        texts, models, phrases, latestRuns,
        embeddingCount, evalRunCount,
    ] = await Promise.all([
        getSourceTexts(),
        getEmbeddingModels(),
        getTestPhrases(),
        getLatestEvalRuns(5),
        prisma.chunkEmbedding.count(),
        prisma.evalRun.count(),
    ])

    const totalChunks = texts.reduce((sum, t) => sum + t._count.chunks, 0)
    const phrasesWithMapping = phrases.filter(p => p.expectedChunkId).length

    // Setup progress steps
    const steps: SetupStep[] = [
        {
            label: 'Texte hochladen',
            href: '/texts',
            icon: <BookText className="h-4 w-4" />,
            done: texts.length > 0,
        },
        {
            label: 'Modelle registrieren',
            href: '/models',
            icon: <Brain className="h-4 w-4" />,
            done: models.length > 0,
        },
        {
            label: 'Suchphrasen anlegen',
            href: '/phrases',
            icon: <MessageSquare className="h-4 w-4" />,
            done: phrasesWithMapping > 0,
        },
        {
            label: 'Embeddings erstellen',
            href: '/embed',
            icon: <FlaskConical className="h-4 w-4" />,
            done: embeddingCount > 0,
        },
        {
            label: 'Evaluation durchführen',
            href: '/evaluate',
            icon: <BarChart3 className="h-4 w-4" />,
            done: evalRunCount > 0,
        },
    ]

    const completedCount = steps.filter(s => s.done).length
    const allDone = completedCount === steps.length

    // Latest eval run for summary
    const latestRun = latestRuns[0] ?? null

    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Embedding-Modell-Vergleichstool — Übersicht
                    </p>
                </div>

                {/* Onboarding: Getting Started */}
                {!allDone && (
                    <Card className="mb-8 border-primary/30">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Erste Schritte
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {completedCount} von {steps.length} Schritten abgeschlossen
                            </p>
                            <Progress
                                value={(completedCount / steps.length) * 100}
                                className="mt-2"
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                {steps.map((step, i) => (
                                    <Link key={i} href={step.href}>
                                        <div className={`flex items-center gap-2.5 rounded-lg border p-3 transition-colors ${
                                            step.done
                                                ? 'border-primary/30 bg-primary/5 text-foreground'
                                                : 'hover:border-primary/50 hover:bg-accent'
                                        }`}>
                                            {step.done ? (
                                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                                            )}
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${
                                                    step.done ? '' : 'text-muted-foreground'
                                                }`}>
                                                    {step.label}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <MetricCard
                        title="Quelltexte"
                        value={texts.length}
                        description={`${totalChunks} Chunks insgesamt`}
                        icon={<BookText className="h-4 w-4" />}
                    />
                    <MetricCard
                        title="Embedding-Modelle"
                        value={models.length}
                        description="Registrierte Modelle"
                        icon={<Brain className="h-4 w-4" />}
                    />
                    <MetricCard
                        title="Suchphrasen"
                        value={phrases.length}
                        description={`${phrasesWithMapping} mit Chunk-Mapping`}
                        icon={<MessageSquare className="h-4 w-4" />}
                    />
                    <MetricCard
                        title="Eval-Runs"
                        value={evalRunCount}
                        description={
                            latestRun
                                ? `Letzter: ${latestRun.model.name} — Top-1 ${latestRun.topKAccuracy1 !== null ? `${(latestRun.topKAccuracy1 * 100).toFixed(0)}%` : '—'}`
                                : 'Noch keine Auswertungen'
                        }
                        icon={<BarChart3 className="h-4 w-4" />}
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Link href="/texts">
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                            <CardContent className="pt-6 flex items-center gap-3">
                                <BookText className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="font-medium">Text hinzufügen</p>
                                    <p className="text-sm text-muted-foreground">Quelltext einfügen und chunken</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/embed">
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                            <CardContent className="pt-6 flex items-center gap-3">
                                <FlaskConical className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="font-medium">Embeddings erzeugen</p>
                                    <p className="text-sm text-muted-foreground">Chunks mit Modell einbetten</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                    <Link href="/compare">
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                            <CardContent className="pt-6 flex items-center gap-3">
                                <GitCompare className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="font-medium">Modelle vergleichen</p>
                                    <p className="text-sm text-muted-foreground">Metriken nebeneinander</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Latest Eval Runs */}
                {latestRuns.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Letzte Evaluierungen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {latestRuns.map(run => (
                                    <div key={run.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{run.model.name}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {run.model.dimensions}d
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span>Top-1: <strong>{run.topKAccuracy1 !== null ? `${(run.topKAccuracy1 * 100).toFixed(0)}%` : '—'}</strong></span>
                                            <span>MRR: <strong>{run.mrrScore !== null ? run.mrrScore.toFixed(3) : '—'}</strong></span>
                                            <span className="text-muted-foreground">{formatDateTime(run.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    )
}
