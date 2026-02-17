import { prisma } from '@/prisma/client'

export interface ConversationEvaluationInput {
    sessionId: string
    userId?: string
    scenarioKey: string
    language: string
    grammarScore: number
    vocabularyScore: number
    communicationScore: number
    corrections: Array<{
        original: string
        corrected: string
        explanation: string
    }>
    feedback: string
}

/**
 * Create a new conversation evaluation.
 */
export async function createConversationEvaluation(data: ConversationEvaluationInput) {
    return prisma.conversationEvaluation.create({
        data: {
            sessionId: data.sessionId,
            userId: data.userId || 'default',
            scenarioKey: data.scenarioKey,
            language: data.language,
            grammarScore: data.grammarScore,
            vocabularyScore: data.vocabularyScore,
            communicationScore: data.communicationScore,
            corrections: data.corrections,
            feedback: data.feedback,
        },
    })
}

/**
 * Get all evaluations for a specific chat session.
 */
export async function getEvaluationsBySessionId(sessionId: string) {
    return prisma.conversationEvaluation.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
    })
}

/**
 * Get all evaluations for a specific scenario.
 */
export async function getEvaluationsByScenario(scenarioKey: string, userId = 'default') {
    return prisma.conversationEvaluation.findMany({
        where: {
            scenarioKey,
            userId,
        },
        orderBy: { createdAt: 'desc' },
    })
}

/**
 * Get evaluation statistics for a user.
 */
export async function getEvaluationStats(userId = 'default') {
    const evaluations = await prisma.conversationEvaluation.findMany({
        where: { userId },
    })

    if (evaluations.length === 0) {
        return {
            totalEvaluations: 0,
            averageGrammar: 0,
            averageVocabulary: 0,
            averageCommunication: 0,
            averageOverall: 0,
            byScenario: {},
        }
    }

    const totalGrammar = evaluations.reduce((sum, e) => sum + e.grammarScore, 0)
    const totalVocabulary = evaluations.reduce((sum, e) => sum + e.vocabularyScore, 0)
    const totalCommunication = evaluations.reduce((sum, e) => sum + e.communicationScore, 0)

    const byScenario: Record<
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
    > = {}

    evaluations.forEach((evaluation) => {
        const key = evaluation.scenarioKey
        if (!byScenario[key]) {
            byScenario[key] = {
                count: 0,
                avgGrammar: 0,
                avgVocabulary: 0,
                avgCommunication: 0,
                avgOverall: 0,
                bestScore: 0,
                lastAttempt: evaluation.createdAt,
            }
        }

        const scenario = byScenario[key]
        scenario.count++
        scenario.avgGrammar += evaluation.grammarScore
        scenario.avgVocabulary += evaluation.vocabularyScore
        scenario.avgCommunication += evaluation.communicationScore

        const overallScore = (evaluation.grammarScore + evaluation.vocabularyScore + evaluation.communicationScore) / 3
        scenario.avgOverall += overallScore
        scenario.bestScore = Math.max(scenario.bestScore, overallScore)

        if (evaluation.createdAt > scenario.lastAttempt) {
            scenario.lastAttempt = evaluation.createdAt
        }
    })

    // Calculate averages
    Object.keys(byScenario).forEach((key) => {
        const scenario = byScenario[key]
        scenario.avgGrammar = scenario.avgGrammar / scenario.count
        scenario.avgVocabulary = scenario.avgVocabulary / scenario.count
        scenario.avgCommunication = scenario.avgCommunication / scenario.count
        scenario.avgOverall = scenario.avgOverall / scenario.count
    })

    return {
        totalEvaluations: evaluations.length,
        averageGrammar: totalGrammar / evaluations.length,
        averageVocabulary: totalVocabulary / evaluations.length,
        averageCommunication: totalCommunication / evaluations.length,
        averageOverall: (totalGrammar + totalVocabulary + totalCommunication) / (evaluations.length * 3),
        byScenario,
    }
}

/**
 * Get the best evaluation for each scenario.
 */
export async function getBestEvaluationsByScenario(userId = 'default') {
    const evaluations = await prisma.conversationEvaluation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    })

    const best: Record<string, typeof evaluations[0]> = {}

    evaluations.forEach((evaluation) => {
        const key = evaluation.scenarioKey
        const score = (evaluation.grammarScore + evaluation.vocabularyScore + evaluation.communicationScore) / 3

        if (!best[key]) {
            best[key] = evaluation
        } else {
            const bestScore =
                (best[key].grammarScore + best[key].vocabularyScore + best[key].communicationScore) / 3
            if (score > bestScore) {
                best[key] = evaluation
            }
        }
    })

    return best
}
