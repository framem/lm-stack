'use server'

import {
    getCombinedDueItems as dbGetCombinedDueItems,
    getDailyPracticeItems as dbGetDailyPracticeItems,
    type SessionMode,
} from '@/src/data-access/session'

export async function getCombinedDueItems(
    limit: number = 30,
    mode: SessionMode = 'all',
    language?: string,
) {
    return dbGetCombinedDueItems(limit, mode, language)
}

export async function getDailyPracticeItems(
    mode: SessionMode = 'all',
    language?: string,
) {
    return dbGetDailyPracticeItems(mode, language)
}
