import { prisma } from '@/src/lib/prisma'

// Get all study plans for the current user
export async function getStudyPlans() {
    return prisma.studyPlan.findMany({
        orderBy: { examDate: 'asc' },
        include: {
            tasks: {
                orderBy: { date: 'asc' },
            },
        },
    })
}

// Get a single study plan with tasks
export async function getStudyPlan(id: string) {
    return prisma.studyPlan.findUnique({
        where: { id },
        include: {
            tasks: {
                orderBy: { date: 'asc' },
            },
        },
    })
}

// Get active study plan (most recent active one)
export async function getActiveStudyPlan() {
    return prisma.studyPlan.findFirst({
        where: { status: 'active' },
        orderBy: { examDate: 'asc' },
        include: {
            tasks: {
                orderBy: { date: 'asc' },
            },
        },
    })
}

// Create a study plan with tasks
export async function createStudyPlan(data: {
    title: string
    examDate: Date
    documentIds: string[]
    tasks: {
        date: Date
        topic: string
        description?: string
        taskType: string
        documentId?: string
    }[]
}) {
    return prisma.studyPlan.create({
        data: {
            title: data.title,
            examDate: data.examDate,
            documentIds: data.documentIds,
            tasks: {
                create: data.tasks,
            },
        },
        include: { tasks: true },
    })
}

// Mark a task as done or skipped
export async function updateTaskStatus(taskId: string, status: 'done' | 'skipped') {
    return prisma.studyTask.update({
        where: { id: taskId },
        data: {
            status,
            completedAt: status === 'done' ? new Date() : null,
        },
    })
}

// Delete a study plan
export async function deleteStudyPlan(id: string) {
    return prisma.studyPlan.delete({ where: { id } })
}

// Archive a study plan
export async function archiveStudyPlan(id: string) {
    return prisma.studyPlan.update({
        where: { id },
        data: { status: 'archived' },
    })
}

// Get today's tasks across all active plans
export async function getTodayTasks() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return prisma.studyTask.findMany({
        where: {
            date: { gte: today, lt: tomorrow },
            plan: { status: 'active' },
        },
        include: {
            plan: { select: { id: true, title: true, examDate: true } },
        },
        orderBy: { date: 'asc' },
    })
}
