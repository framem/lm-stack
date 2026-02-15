export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Navigation } from '@/src/components/Navigation'
import { MetricCard } from '@/src/components/MetricCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { getSourceTexts } from '@/src/data-access/source-texts'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'
import { getTestPhrases } from '@/src/data-access/test-phrases'
import { getLatestEvalRuns } from '@/src/data-access/evaluation'
import { formatDateTime } from '@/src/lib/utils'
import { BookText, Brain, MessageSquare, FlaskConical, BarChart3, GitCompare } from 'lucide-react'

export default async function DashboardPage() {
    const [texts, models, phrases, latestRuns] = await Promise.all([
        getSourceTexts(),
        getEmbeddingModels(),
        getTestPhrases(),
        getLatestEvalRuns(5),
    ])

    const totalChunks = texts.reduce((sum, t) => sum + t._count.chunks, 0)

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
                        title="Testphrasen"
                        value={phrases.length}
                        description={`${phrases.filter(p => p.expectedChunkId).length} mit Chunk-Mapping`}
                        icon={<MessageSquare className="h-4 w-4" />}
                    />
                    <MetricCard
                        title="Eval-Runs"
                        value={latestRuns.length}
                        description="Letzte Auswertungen"
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
