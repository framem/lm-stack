import { prisma } from '@/src/lib/prisma'
import { getWordList } from '@/src/data/cefr-reference'
import { getLanguageSet } from '@/src/data/language-sets'
import type { CefrLevel } from '@/src/data/cefr-reference/types'

// Map language codes to subject names used in document records
const LANGUAGE_CODE_TO_SUBJECT: Record<string, string> = {
    es: 'Spanisch',
    en: 'Englisch',
    de: 'Deutsch',
}

// Create or update a learning goal for a language
export async function upsertLearningGoal(data: {
    language: string
    targetLevel: string
    deadline?: Date | null
}) {
    return prisma.learningGoal.upsert({
        where: {
            userId_language: { userId: 'default', language: data.language },
        },
        create: {
            language: data.language,
            targetLevel: data.targetLevel,
            deadline: data.deadline ?? null,
        },
        update: {
            targetLevel: data.targetLevel,
            deadline: data.deadline ?? null,
        },
    })
}

// Get all learning goals
export async function getLearningGoals() {
    return prisma.learningGoal.findMany({
        where: { userId: 'default' },
        orderBy: { createdAt: 'asc' },
    })
}

// Delete a learning goal
export async function deleteLearningGoal(id: string) {
    return prisma.learningGoal.delete({ where: { id } })
}

/** Target vocabulary count for a language+level combination (cumulative) */
export function getTargetVocabCount(language: string, level: string): number {
    if (language === 'de') {
        // German: use official Goethe-Institut CEFR word counts (cumulative)
        const cefrLevel = level as CefrLevel
        const cumulative: Record<string, number> = {
            A1: getWordList('A1').count,
            A2: getWordList('A1').count + getWordList('A2').count,
            B1: getWordList('A1').count + getWordList('A2').count + getWordList('B1').count,
        }
        return cumulative[cefrLevel] ?? getWordList('A1').count
    }

    // English/Spanish: count items from language sets (cumulative up to level)
    const levels = ['a1', 'a2'] as const
    const targetIdx = levels.indexOf(level.toLowerCase() as typeof levels[number])
    let total = 0
    for (let i = 0; i <= targetIdx; i++) {
        const set = getLanguageSet(`${language}-${levels[i]}`)
        if (set) {
            total += set.categories.reduce((sum, cat) => sum + cat.items.length, 0)
        }
    }
    return total || 500 // Fallback
}

/** Calculate CEFR progress for all active learning goals */
export async function getCefrProgress() {
    const goals = await getLearningGoals()
    if (goals.length === 0) return []

    // Query per-goal counts in parallel, filtering by language subject
    const results = await Promise.all(
        goals.map(async (goal) => {
            const subjectName = LANGUAGE_CODE_TO_SUBJECT[goal.language] ?? goal.language
            const languageFilter = {
                isVocabulary: true,
                document: { subject: subjectName, fileType: 'language-set' as const },
            }

            const [masteredCount, totalVocab, learningCount] = await Promise.all([
                prisma.flashcard.count({
                    where: {
                        ...languageFilter,
                        progress: { repetitions: { gte: 3 } },
                    },
                }),
                prisma.flashcard.count({
                    where: languageFilter,
                }),
                prisma.flashcard.count({
                    where: {
                        ...languageFilter,
                        progress: { isNot: null },
                    },
                }),
            ])

            const target = getTargetVocabCount(goal.language, goal.targetLevel)
            const vocabPercentage = target > 0 ? Math.min(100, Math.round((masteredCount / target) * 100)) : 0

            return {
                id: goal.id,
                language: goal.language,
                targetLevel: goal.targetLevel,
                deadline: goal.deadline,
                vocabMastered: masteredCount,
                vocabLearning: learningCount,
                vocabTotal: totalVocab,
                targetCount: target,
                percentage: vocabPercentage,
            }
        })
    )

    return results
}
