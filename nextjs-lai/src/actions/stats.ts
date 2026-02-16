'use server'

import {
    getDailyActivity as dbGetDailyActivity,
    getKnowledgeTrend as dbGetKnowledgeTrend,
    getSubjectDistribution as dbGetSubjectDistribution,
} from '@/src/data-access/stats'

export async function getDailyActivity(days?: number) {
    return dbGetDailyActivity(days)
}

export async function getKnowledgeTrend(weeks?: number) {
    return dbGetKnowledgeTrend(weeks)
}

export async function getSubjectDistribution() {
    return dbGetSubjectDistribution()
}
