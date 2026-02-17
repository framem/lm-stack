export const dynamic = 'force-dynamic'

import { BarChart3 } from 'lucide-react'
import { getDailyActivity, getKnowledgeTrend, getSubjectDistribution } from '@/src/data-access/stats'
import { StatsCharts } from '@/src/components/StatsCharts'
import { BadgeShowcase } from '@/src/components/BadgeShowcase'
import { getEarnedBadges } from '@/src/data-access/badges'

export default async function StatsPage() {
    const [dailyActivity, knowledgeTrend, subjectDistribution, earnedBadges] = await Promise.all([
        getDailyActivity(90),
        getKnowledgeTrend(12),
        getSubjectDistribution(),
        getEarnedBadges(),
    ])

    const hasData = dailyActivity.length > 0 || knowledgeTrend.length > 0 || subjectDistribution.length > 0

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Lernstatistiken
                </h1>
                <p className="text-muted-foreground mt-1">
                    Überblick über deinen Lernfortschritt und deine Aktivität
                </p>
            </div>

            {/* Badge showcase */}
            <BadgeShowcase earnedBadges={earnedBadges} />

            {hasData ? (
                <StatsCharts
                    dailyActivity={dailyActivity}
                    knowledgeTrend={knowledgeTrend}
                    subjectDistribution={subjectDistribution}
                />
            ) : (
                <div className="text-center py-16 space-y-2">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="text-lg font-medium">Noch keine Statistiken</p>
                    <p className="text-sm text-muted-foreground">
                        Bearbeite Quizze und lerne Karteikarten, um Statistiken zu sehen.
                    </p>
                </div>
            )}
        </div>
    )
}
