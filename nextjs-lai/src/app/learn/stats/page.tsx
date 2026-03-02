export const dynamic = 'force-dynamic'

import { BarChart3 } from 'lucide-react'
import { getDailyLearningTime, getTodayLearningTime, getWeeklyAverageLearningTime } from '@/src/data-access/learning-sessions'
import { getVocabReviewHeatmap, getRetentionCurve, getDifficultWords, getDueForecast } from '@/src/data-access/vocab-stats'
import { getDailyActivity, getKnowledgeTrend } from '@/src/data-access/stats'
import { AnalyticsDashboard } from '@/src/components/AnalyticsDashboard'

export default async function StatsPage() {
    const [
        learningTime,
        todayMinutes,
        weeklyAvgMinutes,
        reviewHeatmap,
        retentionCurve,
        dueForecast,
        difficultWords,
        dailyActivity,
        knowledgeTrend,
    ] = await Promise.all([
        getDailyLearningTime(30),
        getTodayLearningTime(),
        getWeeklyAverageLearningTime(),
        getVocabReviewHeatmap(180),
        getRetentionCurve(),
        getDueForecast(14),
        getDifficultWords(10),
        getDailyActivity(90),
        getKnowledgeTrend(12),
    ])

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <BarChart3 className="h-7 w-7" />
                    Statistiken
                </h1>
                <p className="text-muted-foreground mt-1">
                    Detaillierte Einblicke in deinen Lernfortschritt
                </p>
            </div>

            <AnalyticsDashboard
                learningTime={learningTime}
                todayMinutes={todayMinutes}
                weeklyAvgMinutes={weeklyAvgMinutes}
                reviewHeatmap={reviewHeatmap}
                retentionCurve={retentionCurve}
                dueForecast={dueForecast}
                difficultWords={difficultWords}
                dailyActivity={dailyActivity}
                knowledgeTrend={knowledgeTrend}
            />
        </div>
    )
}
