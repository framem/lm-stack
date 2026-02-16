import { prisma } from '@/src/lib/prisma'

// Get all topics for a document
export async function getTopicsByDocument(documentId: string) {
    return prisma.topic.findMany({
        where: { documentId },
        orderBy: { createdAt: 'asc' },
    })
}

// Get all topics across all documents
export async function getAllTopics() {
    return prisma.topic.findMany({
        orderBy: { createdAt: 'asc' },
        include: { document: { select: { id: true, title: true } } },
    })
}

// Delete all topics for a document
export async function deleteTopicsByDocument(documentId: string) {
    return prisma.topic.deleteMany({ where: { documentId } })
}

export interface TopicCompetency {
    id: string
    name: string
    description: string | null
    documentId: string
    documentTitle?: string
    score: number        // 0-100
    status: 'Beherrscht' | 'Teilweise' | 'Lücke'
    quizScore: number | null
    flashcardScore: number | null
    chunkCount: number
}

// Calculate competency scores for topics
export async function getTopicCompetencies(
    documentId?: string
): Promise<TopicCompetency[]> {
    const topics = documentId
        ? await prisma.topic.findMany({
              where: { documentId },
              include: { document: { select: { title: true } } },
          })
        : await prisma.topic.findMany({
              include: { document: { select: { title: true } } },
          })

    const results: TopicCompetency[] = []

    for (const topic of topics) {
        const chunkIds = topic.chunkIds
        if (chunkIds.length === 0) {
            results.push({
                id: topic.id,
                name: topic.name,
                description: topic.description,
                documentId: topic.documentId,
                documentTitle: topic.document.title,
                score: 0,
                status: 'Lücke',
                quizScore: null,
                flashcardScore: null,
                chunkCount: 0,
            })
            continue
        }

        // Quiz score: find questions linked to these chunks, get latest attempts
        const questions = await prisma.quizQuestion.findMany({
            where: { sourceChunkId: { in: chunkIds } },
            select: { id: true },
        })

        let quizScore: number | null = null
        if (questions.length > 0) {
            const questionIds = questions.map((q) => q.id)
            // Get the latest attempt per question
            const attempts = await prisma.quizAttempt.findMany({
                where: { questionId: { in: questionIds } },
                orderBy: { createdAt: 'desc' },
                distinct: ['questionId'],
                select: { isCorrect: true, freeTextScore: true },
            })
            if (attempts.length > 0) {
                const sum = attempts.reduce((acc, a) => {
                    if (a.freeTextScore !== null) return acc + a.freeTextScore * 100
                    return acc + (a.isCorrect ? 100 : 0)
                }, 0)
                quizScore = sum / attempts.length
            }
        }

        // Flashcard score: find flashcards linked to these chunks, check mastery
        const flashcards = await prisma.flashcard.findMany({
            where: { chunkId: { in: chunkIds } },
            select: { id: true },
        })

        let flashcardScore: number | null = null
        if (flashcards.length > 0) {
            const flashcardIds = flashcards.map((f) => f.id)
            const progress = await prisma.flashcardProgress.findMany({
                where: { flashcardId: { in: flashcardIds } },
                select: { repetitions: true },
            })
            if (progress.length > 0) {
                const mastered = progress.filter((p) => p.repetitions >= 3).length
                flashcardScore = (mastered / progress.length) * 100
            }
        }

        // Combined score: weighted average (60% quiz, 40% flashcard)
        let score = 0
        if (quizScore !== null && flashcardScore !== null) {
            score = quizScore * 0.6 + flashcardScore * 0.4
        } else if (quizScore !== null) {
            score = quizScore
        } else if (flashcardScore !== null) {
            score = flashcardScore
        }

        const status: TopicCompetency['status'] =
            score >= 80 ? 'Beherrscht' : score >= 40 ? 'Teilweise' : 'Lücke'

        results.push({
            id: topic.id,
            name: topic.name,
            description: topic.description,
            documentId: topic.documentId,
            documentTitle: topic.document.title,
            score: Math.round(score),
            status,
            quizScore: quizScore !== null ? Math.round(quizScore) : null,
            flashcardScore: flashcardScore !== null ? Math.round(flashcardScore) : null,
            chunkCount: chunkIds.length,
        })
    }

    return results
}
