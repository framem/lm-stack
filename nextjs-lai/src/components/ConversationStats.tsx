import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { MessageSquare, Award } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'

interface ConversationStatsProps {
    stats: {
        totalEvaluations: number
        averageGrammar: number
        averageVocabulary: number
        averageCommunication: number
        averageOverall: number
        byScenario: Record<
            string,
            {
                count: number
                avgGrammar: number
                avgVocabulary: number
                avgCommunication: number
                avgOverall: number
                bestScore: number
                lastAttempt: Date
            }
        >
    }
}

const SCENARIO_LABELS: Record<string, { icon: string; name: string }> = {
    cafe: { icon: '☕', name: 'Café' },
    restaurant: { icon: '🍽️', name: 'Restaurant' },
    arzt: { icon: '🏥', name: 'Arzt' },
    wegbeschreibung: { icon: '🗺️', name: 'Wegbeschreibung' },
    supermarkt: { icon: '🛒', name: 'Supermarkt' },
    hotel: { icon: '🏨', name: 'Hotel' },
}

function ScoreBar({ label, score }: { label: string; score: number }) {
    const percentage = (score / 10) * 100
    const color =
        score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : score >= 4 ? 'bg-orange-500' : 'bg-red-500'

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{score.toFixed(1)}/10</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    )
}

export function ConversationStats({ stats }: ConversationStatsProps) {
    const scenarioKeys = Object.keys(stats.byScenario).sort()

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Konversationsübungen
                </CardTitle>
                <CardDescription>
                    {stats.totalEvaluations} {stats.totalEvaluations === 1 ? 'Bewertung' : 'Bewertungen'} insgesamt
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Overall scores */}
                <div className="space-y-3">
                    <h3 className="text-sm font-medium">Durchschnittliche Bewertung</h3>
                    <ScoreBar label="Grammatik" score={stats.averageGrammar} />
                    <ScoreBar label="Wortschatz" score={stats.averageVocabulary} />
                    <ScoreBar label="Kommunikation" score={stats.averageCommunication} />
                    <div className="pt-2 border-t">
                        <ScoreBar label="Gesamt" score={stats.averageOverall} />
                    </div>
                </div>

                {/* Per scenario */}
                {scenarioKeys.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium">Nach Szenario</h3>
                        <div className="grid gap-3">
                            {scenarioKeys.map((key) => {
                                const scenario = stats.byScenario[key]
                                const label = SCENARIO_LABELS[key] || { icon: '💬', name: key }

                                return (
                                    <div
                                        key={key}
                                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                                    >
                                        <span className="text-2xl">{label.icon}</span>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{label.name}</span>
                                                <Badge variant="outline" className="gap-1">
                                                    <Award className="h-3 w-3" />
                                                    {scenario.bestScore.toFixed(1)}/10
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>{scenario.count}× geübt</span>
                                                <span>Ø {scenario.avgOverall.toFixed(1)}/10</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
