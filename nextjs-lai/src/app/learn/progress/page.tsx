export const dynamic = 'force-dynamic'

import { TrendingUp } from 'lucide-react'
import { ProgressPageClient } from './progress-page-client'
import { getLearnerProfile } from '@/src/data-access/learning-paths'
import { generateLearningRecommendation } from '@/src/lib/learning-path-generator'
import { getDailyActivity, getKnowledgeTrend, getSubjectDistribution } from '@/src/data-access/stats'
import { getEarnedBadges } from '@/src/data-access/badges'
import { getEvaluationStats } from '@/src/data-access/conversation-evaluation'

export default async function ProgressPage() {
    // Fetch all data in parallel
    const [
        profile,
        dailyActivity,
        knowledgeTrend,
        subjectDistribution,
        earnedBadges,
        evaluationStats,
    ] = await Promise.all([
        getLearnerProfile(),
        getDailyActivity(90),
        getKnowledgeTrend(12),
        getSubjectDistribution(),
        getEarnedBadges(),
        getEvaluationStats(),
    ])

    // Generate recommendation if documents exist
    const recommendation = profile.documents.length > 0
        ? await generateLearningRecommendation(profile)
        : null

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-primary" />
                    Fortschritt
                </h1>
                <p className="text-muted-foreground mt-1">
                    Überblick über deinen Lernfortschritt und deine Aktivität
                </p>
            </div>

            <ProgressPageClient
                profile={profile}
                recommendation={recommendation}
                dailyActivity={dailyActivity}
                knowledgeTrend={knowledgeTrend}
                subjectDistribution={subjectDistribution}
                earnedBadges={earnedBadges}
                evaluationStats={evaluationStats}
            />
        </div>
    )
}
