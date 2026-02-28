'use server'

import {
    getVocabReviewHeatmap as dbGetVocabReviewHeatmap,
    getRetentionCurve as dbGetRetentionCurve,
    getDifficultWords as dbGetDifficultWords,
    getDueForecast as dbGetDueForecast,
} from '@/src/data-access/vocab-stats'

export async function fetchVocabReviewHeatmap(days?: number) {
    return dbGetVocabReviewHeatmap(days)
}

export async function fetchRetentionCurve() {
    return dbGetRetentionCurve()
}

export async function fetchDifficultWords(limit?: number) {
    return dbGetDifficultWords(limit)
}

export async function fetchDueForecast(days?: number) {
    return dbGetDueForecast(days)
}
