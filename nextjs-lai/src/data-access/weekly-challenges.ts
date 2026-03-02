import { prisma } from '@/src/lib/prisma'

export interface ChallengeTemplate {
    title: string
    description: string
    area: string
    targetValue: number
}

// ── Pre-defined challenge templates ──

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
    { title: 'Vokabel-Sprint', description: 'Lerne 30 neue Vokabeln diese Woche', area: 'vocabulary', targetValue: 30 },
    { title: 'Wiederholungs-König', description: 'Wiederhole 50 fällige Vokabeln', area: 'vocabulary', targetValue: 50 },
    { title: 'Quiz-Marathon', description: 'Beantworte 40 Quizfragen richtig', area: 'grammar', targetValue: 40 },
    { title: 'Schreibprofi', description: 'Schreibe 5 Texte und erhalte Feedback', area: 'writing', targetValue: 5 },
    { title: 'Gesprächspartner', description: 'Führe 3 Konversationsübungen durch', area: 'speaking', targetValue: 3 },
    { title: 'Hörversteher', description: 'Absolviere 3 Hörübungen', area: 'listening', targetValue: 3 },
    { title: 'Täglicher Lerner', description: 'Lerne an 5 von 7 Tagen', area: 'general', targetValue: 5 },
    { title: 'XP-Jäger', description: 'Sammle 200 XP in einer Woche', area: 'general', targetValue: 200 },
]

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
