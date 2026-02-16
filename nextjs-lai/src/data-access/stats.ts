import { prisma } from '@/src/lib/prisma'

export interface DailyActivity {
    date: string
    quizAttempts: number
    flashcardReviews: number
    total: number
}

export interface WeeklyTrend {
    week: string
    avgScore: number
}

export interface SubjectDistribution {
    subject: string
    documents: number
    quizzes: number
    flashcards: number
}

// Get daily activity for the last N days (quiz attempts + flashcard reviews per day)
export async function getDailyActivity(days: number = 90): Promise<DailyActivity[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const quizActivity = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "QuizAttempt"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
    `

    const flashcardActivity = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("lastReviewedAt") as date, COUNT(*) as count
        FROM "FlashcardProgress"
        WHERE "lastReviewedAt" >= ${since}
        GROUP BY DATE("lastReviewedAt")
    `

    // Merge into a single map
    const map = new Map<string, DailyActivity>()

    for (const row of quizActivity) {
        const dateStr = new Date(row.date).toISOString().split('T')[0]
        const existing = map.get(dateStr) || { date: dateStr, quizAttempts: 0, flashcardReviews: 0, total: 0 }
        existing.quizAttempts = Number(row.count)
        existing.total = existing.quizAttempts + existing.flashcardReviews
        map.set(dateStr, existing)
    }

    for (const row of flashcardActivity) {
        const dateStr = new Date(row.date).toISOString().split('T')[0]
        const existing = map.get(dateStr) || { date: dateStr, quizAttempts: 0, flashcardReviews: 0, total: 0 }
        existing.flashcardReviews = Number(row.count)
        existing.total = existing.quizAttempts + existing.flashcardReviews
        map.set(dateStr, existing)
    }

    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}

// Get weekly knowledge trend (average score over time)
export async function getKnowledgeTrend(weeks: number = 12): Promise<WeeklyTrend[]> {
    const since = new Date()
    since.setDate(since.getDate() - weeks * 7)

    const rows = await prisma.$queryRaw<{ week: string; avg_score: number }[]>`
        SELECT TO_CHAR(DATE_TRUNC('week', "createdAt"), 'IYYY-IW') as week,
               AVG(
                   CASE
                       WHEN "freeTextScore" IS NOT NULL THEN "freeTextScore"
                       WHEN "isCorrect" = true THEN 1.0
                       ELSE 0.0
                   END
               ) as avg_score
        FROM "QuizAttempt"
        WHERE "createdAt" >= ${since}
        GROUP BY DATE_TRUNC('week', "createdAt"), TO_CHAR(DATE_TRUNC('week', "createdAt"), 'IYYY-IW')
        ORDER BY DATE_TRUNC('week', "createdAt")
    `

    return rows.map((r) => ({
        week: r.week,
        avgScore: Math.round(Number(r.avg_score) * 100),
    }))
}

// Get subject distribution (documents, quizzes, flashcards per subject)
export async function getSubjectDistribution(): Promise<SubjectDistribution[]> {
    const docs = await prisma.document.groupBy({
        by: ['subject'],
        _count: true,
        where: { subject: { not: null } },
    })

    const subjects = new Map<string, SubjectDistribution>()

    for (const doc of docs) {
        if (!doc.subject) continue
        subjects.set(doc.subject, {
            subject: doc.subject,
            documents: doc._count,
            quizzes: 0,
            flashcards: 0,
        })
    }

    // Count quizzes per subject
    const quizCounts = await prisma.quiz.groupBy({
        by: ['documentId'],
        _count: true,
    })
    const docSubjectMap = await prisma.document.findMany({
        where: { subject: { not: null } },
        select: { id: true, subject: true },
    })
    const docToSubject = new Map(docSubjectMap.map((d) => [d.id, d.subject!]))

    for (const qc of quizCounts) {
        const subject = docToSubject.get(qc.documentId)
        if (!subject) continue
        const entry = subjects.get(subject)
        if (entry) entry.quizzes += qc._count
    }

    // Count flashcards per subject
    const fcCounts = await prisma.flashcard.groupBy({
        by: ['documentId'],
        _count: true,
    })

    for (const fc of fcCounts) {
        const subject = docToSubject.get(fc.documentId)
        if (!subject) continue
        const entry = subjects.get(subject)
        if (entry) entry.flashcards += fc._count
    }

    return [...subjects.values()].sort((a, b) => b.documents - a.documents)
}
