'use server'

import {
    getActiveChallenges as dbGetActiveChallenges,
    getCompletedChallenges as dbGetCompletedChallenges,
    createChallenge as dbCreateChallenge,
    updateChallengeProgress as dbUpdateChallengeProgress,
    deleteChallenge as dbDeleteChallenge,
    getChallengeStats as dbGetChallengeStats,
    CHALLENGE_TEMPLATES,
    type ChallengeTemplate,
} from '@/src/data-access/weekly-challenges'

export async function getActiveChallenges() {
    return dbGetActiveChallenges()
}

export async function getCompletedChallenges(limit?: number) {
    return dbGetCompletedChallenges(limit)
}

export async function createChallenge(template: ChallengeTemplate) {
    return dbCreateChallenge(template)
}

export async function updateChallengeProgress(challengeId: string, newValue: number) {
    return dbUpdateChallengeProgress(challengeId, newValue)
}

export async function deleteChallenge(challengeId: string) {
    return dbDeleteChallenge(challengeId)
}

export async function getChallengeStats() {
    return dbGetChallengeStats()
}

export function getChallengeTemplates() {
    return CHALLENGE_TEMPLATES
}
