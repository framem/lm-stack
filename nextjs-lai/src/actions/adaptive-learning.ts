'use server'

import {
    getAdaptiveLearningData as dbGetAdaptiveLearningData,
    type AdaptiveLearningData,
} from '@/src/data-access/adaptive-learning'

export async function getAdaptiveLearningData(
    languageCode: string,
    languageName: string,
): Promise<AdaptiveLearningData> {
    return dbGetAdaptiveLearningData(languageCode, languageName)
}
