'use server'

import { getCombinedDueItems as dbGetCombinedDueItems } from '@/src/data-access/session'

export async function getCombinedDueItems(limit: number = 30) {
    return dbGetCombinedDueItems(limit)
}
