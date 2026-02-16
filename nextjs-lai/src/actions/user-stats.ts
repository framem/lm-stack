'use server'

import {
    getOrCreateUserStats as dbGetOrCreateUserStats,
    recordActivity as dbRecordActivity,
    updateDailyGoal as dbUpdateDailyGoal,
} from '@/src/data-access/user-stats'

export async function getUserStats() {
    return dbGetOrCreateUserStats()
}

export async function recordActivity() {
    return dbRecordActivity()
}

export async function updateDailyGoal(goal: number) {
    if (goal < 1 || goal > 100) {
        throw new Error('Tagesziel muss zwischen 1 und 100 liegen.')
    }
    return dbUpdateDailyGoal(goal)
}
