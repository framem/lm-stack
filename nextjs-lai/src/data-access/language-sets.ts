import { prisma } from '@/src/lib/prisma'
import { getLanguageSet } from '@/src/data/language-sets'

export interface CategoryStat {
    name: string
    total: number
    newCount: number
    learningCount: number
    masteredCount: number
    dueCount: number
    lessonIndex: number
    unlocked: boolean
    completedPct: number
    cards: Array<{
        id: string
        front: string
        back: string
        partOfSpeech: string | null
        exampleSentence: string | null
        progress: { reps: number; repetitions: number; due: Date | null; nextReviewAt: Date | null } | null
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
                lessonIndex: 0,
                unlocked: false,
                completedPct: 0,
                cards: [],
            })
        }
        const cat = categoryMap.get(catName)!

        const reps = fc.progress?.reps ?? fc.progress?.repetitions ?? 0
        const isDue = !fc.progress || (fc.progress.due !== null && fc.progress.due <= now)

        cat.total++
        cat.cards.push({
            id: fc.id,
            front: fc.front,
            back: fc.back,
            partOfSpeech: fc.partOfSpeech ?? null,
            exampleSentence: fc.exampleSentence ?? null,
            progress: fc.progress
                ? { reps: fc.progress.reps, repetitions: fc.progress.repetitions, due: fc.progress.due, nextReviewAt: fc.progress.nextReviewAt }
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

    // Compute lesson index, completion percentage, and unlock status
    for (let i = 0; i < categories.length; i++) {
        const cat = categories[i]
        cat.lessonIndex = i
        cat.completedPct = cat.total > 0 ? Math.round((cat.masteredCount / cat.total) * 100) : 0
        // Lesson 0 is always unlocked; subsequent lessons unlock when previous is ≥80% mastered
        cat.unlocked = i === 0 || categories[i - 1].completedPct >= 80
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
