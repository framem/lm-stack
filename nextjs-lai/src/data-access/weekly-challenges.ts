import { prisma } from '@/src/lib/prisma'
import { type ChallengeTemplate } from '@/src/data/challenge-templates'

export { CHALLENGE_TEMPLATES, type ChallengeTemplate } from '@/src/data/challenge-templates'

// ── Get active (current week) challenges ──

export async function getActiveChallenges() {
    const now = new Date()
    return prisma.weeklyChallenge.findMany({
        where: {
            endDate: { gte: now },
            startDate: { lte: now },
        },
        orderBy: { createdAt: 'desc' },
    })
}

// ── Get completed (past) challenges ──

export async function getCompletedChallenges(limit: number = 10) {
    return prisma.weeklyChallenge.findMany({
        where: { completed: true },
        orderBy: { endDate: 'desc' },
        take: limit,
    })
}

// ── Create a new weekly challenge ──

export async function createChallenge(template: ChallengeTemplate) {
    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + 7)

    return prisma.weeklyChallenge.create({
        data: {
            title: template.title,
            description: template.description,
            area: template.area,
            targetValue: template.targetValue,
            startDate: now,
            endDate,
        },
    })
}

// ── Update challenge progress ──

export async function updateChallengeProgress(challengeId: string, newValue: number) {
    const challenge = await prisma.weeklyChallenge.findUnique({
        where: { id: challengeId },
    })
    if (!challenge) return null

    const completed = newValue >= challenge.targetValue
    return prisma.weeklyChallenge.update({
        where: { id: challengeId },
        data: {
            currentValue: newValue,
            completed,
        },
    })
}

// ── Delete a challenge ──

export async function deleteChallenge(challengeId: string) {
    return prisma.weeklyChallenge.delete({
        where: { id: challengeId },
    })
}

// ── Get challenge stats summary ──

export async function getChallengeStats() {
    const [totalCompleted, totalCreated] = await Promise.all([
        prisma.weeklyChallenge.count({ where: { completed: true } }),
        prisma.weeklyChallenge.count(),
    ])
    return { totalCompleted, totalCreated }
}
