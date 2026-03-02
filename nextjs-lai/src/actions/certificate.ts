'use server'

import { prisma } from '@/src/lib/prisma'
import { getLanguageSetDetail } from '@/src/data-access/language-sets'
import { languageSets } from '@/src/data/language-sets'
import { getDailyLearningTime } from '@/src/data-access/learning-sessions'

// Data sent to the client for certificate rendering
export interface CertificateData {
    language: string
    languageCode: string
    level: string
    setTitle: string
    totalCards: number
    masteredCards: number
    masteredPct: number
    totalXp: number
    currentStreak: number
    longestStreak: number
    totalLearningMinutes: number
    quizzesCompleted: number
    completedAt: string // ISO date
}

export interface LanguageProgressSummary {
    language: string
    languageCode: string
    flag: string
    totalCards: number
    masteredCards: number
    masteredPct: number
    totalXp: number
    currentStreak: number
    longestStreak: number
    totalLearningMinutes: number
    quizzesCompleted: number
    levels: Array<{
        level: string
        setTitle: string
        totalCards: number
        masteredCards: number
        masteredPct: number
        completed: boolean
    }>
}

// Fetch certificate data for a specific language level.
// Available if the set is imported and user has any activity (mastered > 0).
export async function getCertificateData(
    languageCode: string,
    language: string,
    level: string,
): Promise<CertificateData | null> {
    const setId = `${languageCode}-${level}`
    const detail = await getLanguageSetDetail(setId)
    if (!detail || !detail.imported) return null

    const masteredPct = detail.totalCards > 0
        ? Math.round((detail.masteredCards / detail.totalCards) * 100)
        : 0

    // Certificate available when there is any learning activity
    if (detail.masteredCards === 0 && detail.totalCards - detail.newCards === 0) return null

    const userStats = await prisma.userStats.findFirst()
    const dailyData = await getDailyLearningTime(365)
    const totalLearningMinutes = dailyData.reduce((s, d) => s + d.minutes, 0)

    const quizzesCompleted = await prisma.quiz.count()

    return {
        language,
        languageCode,
        level: level.toUpperCase(),
        setTitle: detail.set.title,
        totalCards: detail.totalCards,
        masteredCards: detail.masteredCards,
        masteredPct,
        totalXp: userStats?.totalXp ?? 0,
        currentStreak: userStats?.currentStreak ?? 0,
        longestStreak: userStats?.longestStreak ?? 0,
        totalLearningMinutes,
        quizzesCompleted,
        completedAt: new Date().toISOString(),
    }
}

// Check which levels have certificates available (for the certificate grid)
export interface CertificateLevelStatus {
    level: string
    setTitle: string
    available: boolean
    masteredPct: number
    totalCards: number
    masteredCards: number
    imported: boolean
}

export async function getCertificateLevelsForLanguage(
    languageCode: string,
    language: string,
): Promise<CertificateLevelStatus[]> {
    const langSets = languageSets.filter((s) => s.subject === language)
    const result: CertificateLevelStatus[] = []

    for (const set of langSets) {
        const detail = await getLanguageSetDetail(set.id)
        if (detail && detail.imported) {
            const pct = detail.totalCards > 0
                ? Math.round((detail.masteredCards / detail.totalCards) * 100)
                : 0
            // Available if user has any activity for this level
            const hasActivity = detail.masteredCards > 0 || (detail.totalCards - detail.newCards) > 0
            result.push({
                level: set.level,
                setTitle: set.title,
                available: hasActivity,
                masteredPct: pct,
                totalCards: detail.totalCards,
                masteredCards: detail.masteredCards,
                imported: true,
            })
        } else {
            result.push({
                level: set.level,
                setTitle: set.title,
                available: false,
                masteredPct: 0,
                totalCards: 0,
                masteredCards: 0,
                imported: false,
            })
        }
    }
    return result
}

// Fetch full progress summary for a language (for progress export)
export async function getLanguageProgress(
    languageCode: string,
    language: string,
    flag: string,
): Promise<LanguageProgressSummary> {
    const langSets = languageSets.filter((s) => s.subject === language)

    const levels: LanguageProgressSummary['levels'] = []
    let totalCards = 0
    let masteredCards = 0

    for (const set of langSets) {
        const detail = await getLanguageSetDetail(set.id)
        if (detail && detail.imported) {
            const pct = detail.totalCards > 0
                ? Math.round((detail.masteredCards / detail.totalCards) * 100)
                : 0
            levels.push({
                level: set.level,
                setTitle: set.title,
                totalCards: detail.totalCards,
                masteredCards: detail.masteredCards,
                masteredPct: pct,
                completed: pct >= 80,
            })
            totalCards += detail.totalCards
            masteredCards += detail.masteredCards
        } else {
            levels.push({
                level: set.level,
                setTitle: set.title,
                totalCards: 0,
                masteredCards: 0,
                masteredPct: 0,
                completed: false,
            })
        }
    }

    const masteredPct = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0
    const userStats = await prisma.userStats.findFirst()
    const dailyData = await getDailyLearningTime(365)
    const totalLearningMinutes = dailyData.reduce((s, d) => s + d.minutes, 0)
    const quizzesCompleted = await prisma.quiz.count()

    return {
        language,
        languageCode,
        flag,
        totalCards,
        masteredCards,
        masteredPct,
        totalXp: userStats?.totalXp ?? 0,
        currentStreak: userStats?.currentStreak ?? 0,
        longestStreak: userStats?.longestStreak ?? 0,
        totalLearningMinutes,
        quizzesCompleted,
        levels,
    }
}
