'use server'

import {
    getEvaluationsByScenario,
    getEvaluationStats,
    getBestEvaluationsByScenario,
} from '@/src/data-access/conversation-evaluation'

/**
 * Get all evaluations for a specific scenario.
 */
export async function getScenarioEvaluations(scenarioKey: string, userId = 'default') {
    return getEvaluationsByScenario(scenarioKey, userId)
}

/**
 * Get evaluation statistics for a user.
 */
export async function getUserEvaluationStats(userId = 'default') {
    return getEvaluationStats(userId)
}

/**
 * Get the best evaluation for each scenario.
 */
export async function getUserBestEvaluations(userId = 'default') {
    return getBestEvaluationsByScenario(userId)
}
