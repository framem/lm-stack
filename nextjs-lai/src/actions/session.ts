'use server'

import {
    getCombinedDueItems as dbGetCombinedDueItems,
    getDailyPracticeItems as dbGetDailyPracticeItems,
} from '@/src/data-access/session'

export async function getCombinedDueItems(limit: number = 30) {
    return dbGetCombinedDueItems(limit)
}

export async function getDailyPracticeItems() {
    return dbGetDailyPracticeItems()
}
