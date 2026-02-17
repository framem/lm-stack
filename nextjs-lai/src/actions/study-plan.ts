'use server'

import { revalidatePath } from 'next/cache'
import {
    getStudyPlans as dbGetStudyPlans,
    getStudyPlan as dbGetStudyPlan,
    getActiveStudyPlan as dbGetActiveStudyPlan,
    createStudyPlan as dbCreateStudyPlan,
    updateTaskStatus as dbUpdateTaskStatus,
    deleteStudyPlan as dbDeleteStudyPlan,
    archiveStudyPlan as dbArchiveStudyPlan,
    getTodayTasks as dbGetTodayTasks,
} from '@/src/data-access/study-plan'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { extractTopics } from '@/src/lib/topic-extraction'
import { prisma } from '@/src/lib/prisma'

export async function getStudyPlans() {
    return dbGetStudyPlans()
}

export async function getStudyPlan(id: string) {
    return dbGetStudyPlan(id)
}

export async function getActiveStudyPlan() {
    return dbGetActiveStudyPlan()
}

export async function getTodayTasks() {
    return dbGetTodayTasks()
}

// Generate and create a study plan from documents + exam date
export async function generateStudyPlan(input: {
    title: string
    documentIds: string[]
    examDate: string // ISO string
}) {
    const { title, documentIds, examDate: examDateStr } = input
    const examDate = new Date(examDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (examDate <= today) {
        throw new Error('Prüfungsdatum muss in der Zukunft liegen.')
    }

    if (documentIds.length === 0) {
        throw new Error('Mindestens ein Lernmaterial auswählen.')
    }

    // Collect topics from all documents (extract if missing)
    const allTopics: { name: string; description?: string; documentId: string; documentTitle: string }[] = []

    for (const docId of documentIds) {
        // Check for existing topics
        const existing = await prisma.topic.findMany({ where: { documentId: docId } })

        if (existing.length > 0) {
            const doc = await prisma.document.findUnique({ where: { id: docId }, select: { title: true } })
            for (const t of existing) {
                allTopics.push({
                    name: t.name,
                    description: t.description ?? undefined,
                    documentId: docId,
                    documentTitle: doc?.title ?? docId,
                })
            }
        } else {
            // Extract topics on the fly
            const doc = await getDocumentWithChunks(docId)
            if (doc && doc.chunks.length > 0) {
                const extracted = await extractTopics(doc.chunks)
                for (const t of extracted) {
                    allTopics.push({
                        name: t.name,
                        description: t.chunkIds.length > 0 ? undefined : undefined,
                        documentId: docId,
                        documentTitle: doc.title,
                    })
                }
            }
        }
    }

    // If no topics extracted, create one per document
    if (allTopics.length === 0) {
        for (const docId of documentIds) {
            const doc = await prisma.document.findUnique({ where: { id: docId }, select: { title: true } })
            allTopics.push({
                name: doc?.title ?? 'Lernmaterial',
                documentId: docId,
                documentTitle: doc?.title ?? docId,
            })
        }
    }

    // Calculate available days (exclude exam day itself)
    const daysUntilExam = Math.max(1, Math.floor((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

    // Distribution algorithm:
    // Phase 1 (60% of time): New material — learn each topic once
    // Phase 2 (25% of time): Review — revisit weak topics with quiz/flashcards
    // Phase 3 (15% of time): Final review — mixed practice
    const phase1Days = Math.max(1, Math.ceil(daysUntilExam * 0.6))
    const phase2Days = Math.max(1, Math.ceil(daysUntilExam * 0.25))
    const phase3Days = Math.max(1, daysUntilExam - phase1Days - phase2Days)

    const tasks: {
        date: Date
        topic: string
        description?: string
        taskType: string
        documentId?: string
    }[] = []

    // Phase 1: Learn new topics (read + flashcards)
    for (let i = 0; i < allTopics.length; i++) {
        const dayIndex = Math.floor((i / allTopics.length) * phase1Days)
        const taskDate = new Date(today)
        taskDate.setDate(taskDate.getDate() + dayIndex + 1) // Start tomorrow

        const topic = allTopics[i]

        // Read task
        tasks.push({
            date: taskDate,
            topic: topic.name,
            description: `${topic.documentTitle}: ${topic.name} lesen und verstehen`,
            taskType: 'read',
            documentId: topic.documentId,
        })

        // Flashcards for the same topic
        tasks.push({
            date: taskDate,
            topic: topic.name,
            description: `Karteikarten zu ${topic.name} lernen`,
            taskType: 'flashcards',
            documentId: topic.documentId,
        })
    }

    // Phase 2: Review with quizzes
    for (let d = 0; d < phase2Days; d++) {
        const taskDate = new Date(today)
        taskDate.setDate(taskDate.getDate() + phase1Days + d + 1)

        // Pick topics for review (cycle through)
        const topicIdx = d % allTopics.length
        const topic = allTopics[topicIdx]

        tasks.push({
            date: taskDate,
            topic: topic.name,
            description: `Quiz-Wiederholung: ${topic.name}`,
            taskType: 'quiz',
            documentId: topic.documentId,
        })

        tasks.push({
            date: taskDate,
            topic: topic.name,
            description: `Fällige Karteikarten wiederholen`,
            taskType: 'review',
            documentId: topic.documentId,
        })
    }

    // Phase 3: Final review — mixed practice
    for (let d = 0; d < phase3Days; d++) {
        const taskDate = new Date(today)
        taskDate.setDate(taskDate.getDate() + phase1Days + phase2Days + d + 1)

        tasks.push({
            date: taskDate,
            topic: 'Gesamtwiederholung',
            description: `Gesamtwiederholung Tag ${d + 1}: Quiz über alle Themen`,
            taskType: 'quiz',
            documentId: documentIds[d % documentIds.length],
        })

        tasks.push({
            date: taskDate,
            topic: 'Gesamtwiederholung',
            description: `Alle fälligen Wiederholungen`,
            taskType: 'review',
        })
    }

    const plan = await dbCreateStudyPlan({
        title,
        examDate,
        documentIds,
        tasks,
    })

    revalidatePath('/learn')
    revalidatePath('/learn/plan')

    return plan
}

// Mark a task as done
export async function completeTask(taskId: string) {
    await dbUpdateTaskStatus(taskId, 'done')
    revalidatePath('/learn/plan')
    revalidatePath('/learn')
}

// Skip a task
export async function skipTask(taskId: string) {
    await dbUpdateTaskStatus(taskId, 'skipped')
    revalidatePath('/learn/plan')
}

// Delete a study plan
export async function deleteStudyPlan(id: string) {
    await dbDeleteStudyPlan(id)
    revalidatePath('/learn/plan')
    revalidatePath('/learn')
}

// Archive a completed study plan
export async function archiveStudyPlan(id: string) {
    await dbArchiveStudyPlan(id)
    revalidatePath('/learn/plan')
}
