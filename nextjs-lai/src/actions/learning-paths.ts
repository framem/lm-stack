'use server'

import {
    getLearnerProfile as dbGetLearnerProfile,
    getWeakChunksForDocument as dbGetWeakChunks,
} from '@/src/data-access/learning-paths'
import { generateLearningRecommendation } from '@/src/lib/learning-path-generator'

export async function getLearnerProfile() {
    return dbGetLearnerProfile()
}

export async function getWeakChunksForDocument(documentId: string) {
    return dbGetWeakChunks(documentId)
}

export async function generateRecommendation() {
    const profile = await dbGetLearnerProfile()
    return generateLearningRecommendation(profile)
}
