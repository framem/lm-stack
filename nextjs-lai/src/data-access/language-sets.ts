import { prisma } from '@/src/lib/prisma'
import { getLanguageSet } from '@/src/data/language-sets'

export interface CategoryStat {
    name: string
    total: number
    newCount: number
    learningCount: number
    masteredCount: number
    dueCount: number
    cards: Array<{
        id: string
        front: string
        back: string
        partOfSpeech: string | null
        exampleSentence: string | null
        progress: { repetitions: number; nextReviewAt: Date | null } | null
    }>
}

export interface LanguageSetDetail {
    set: {
        id: string
        title: string
        subject: string
        description: string
        level: string
    }
    imported: boolean
    documentId: string | null
    categories: CategoryStat[]
    totalCards: number
    newCards: number
    learningCards: number
    masteredCards: number
    dueCards: number
}

export async function getLanguageSetDetail(setId: string): Promise<LanguageSetDetail | null> {
    const set = getLanguageSet(setId)
    if (!set) return null

    const doc = await prisma.document.findFirst({
        where: { title: set.title, fileType: 'language-set' },
        include: {
            flashcards: {
                where: { isVocabulary: true },
                include: { progress: true },
                orderBy: { createdAt: 'asc' },
            },
        },
    })

    const now = new Date()

    if (!doc) {
        return {
            set: {
                id: set.id,
                title: set.title,
                subject: set.subject,
                description: set.description,
                level: set.level,
            },
            imported: false,
            documentId: null,
            categories: [],
            totalCards: 0,
            newCards: 0,
            learningCards: 0,
            masteredCards: 0,
            dueCards: 0,
        }
    }

    // Group flashcards by context (= category name)
    const categoryMap = new Map<string, CategoryStat>()

    for (const fc of doc.flashcards) {
        const catName = fc.context ?? 'Sonstige'
        if (!categoryMap.has(catName)) {
            categoryMap.set(catName, {
                name: catName,
                total: 0,
                newCount: 0,
                learningCount: 0,
                masteredCount: 0,
                dueCount: 0,
                cards: [],
            })
        }
        const cat = categoryMap.get(catName)!

        const reps = fc.progress?.repetitions ?? 0
        const isDue = !fc.progress || (fc.progress.nextReviewAt !== null && fc.progress.nextReviewAt <= now)

        cat.total++
        cat.cards.push({
            id: fc.id,
            front: fc.front,
            back: fc.back,
            partOfSpeech: fc.partOfSpeech ?? null,
            exampleSentence: fc.exampleSentence ?? null,
            progress: fc.progress
                ? { repetitions: fc.progress.repetitions, nextReviewAt: fc.progress.nextReviewAt }
                : null,
        })

        if (reps === 0) {
            cat.newCount++
        } else if (reps < 3) {
            cat.learningCount++
        } else {
            cat.masteredCount++
        }

        if (isDue) cat.dueCount++
    }

    // Preserve category order from static definition
    const categories: CategoryStat[] = set.categories
        .map(c => categoryMap.get(c.name))
        .filter((c): c is CategoryStat => c !== undefined)

    // Add any leftover categories not in static definition
    for (const [name, cat] of categoryMap) {
        if (!categories.find(c => c.name === name)) {
            categories.push(cat)
        }
    }

    const totalCards = doc.flashcards.length
    const newCards = categories.reduce((s, c) => s + c.newCount, 0)
    const learningCards = categories.reduce((s, c) => s + c.learningCount, 0)
    const masteredCards = categories.reduce((s, c) => s + c.masteredCount, 0)
    const dueCards = categories.reduce((s, c) => s + c.dueCount, 0)

    return {
        set: {
            id: set.id,
            title: set.title,
            subject: set.subject,
            description: set.description,
            level: set.level,
        },
        imported: true,
        documentId: doc.id,
        categories,
        totalCards,
        newCards,
        learningCards,
        masteredCards,
        dueCards,
    }
}
