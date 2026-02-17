import { prisma } from '@/src/lib/prisma'

export interface GeneratedScenarioInput {
    key: string
    language: string
    difficulty: string
    icon: string
    title: string
    description: string
    systemPrompt: string
    suggestions: string[]
    userId?: string
}

/**
 * Create a new generated scenario.
 */
export async function createGeneratedScenario(data: GeneratedScenarioInput) {
    return prisma.generatedScenario.create({
        data: {
            key: data.key,
            language: data.language,
            difficulty: data.difficulty,
            icon: data.icon,
            title: data.title,
            description: data.description,
            systemPrompt: data.systemPrompt,
            suggestions: data.suggestions,
            userId: data.userId || 'default',
        },
    })
}

/**
 * Get all generated scenarios, optionally filtered by language and/or difficulty.
 */
export async function getGeneratedScenarios(opts: {
    language?: string
    difficulty?: string
    userId?: string
} = {}) {
    return prisma.generatedScenario.findMany({
        where: {
            ...(opts.language && { language: opts.language }),
            ...(opts.difficulty && { difficulty: opts.difficulty }),
            ...(opts.userId && { userId: opts.userId }),
        },
        orderBy: { createdAt: 'desc' },
    })
}

/**
 * Get a single generated scenario by its unique key.
 */
export async function getGeneratedScenarioByKey(key: string) {
    return prisma.generatedScenario.findUnique({
        where: { key },
    })
}

/**
 * Delete a generated scenario by id.
 */
export async function deleteGeneratedScenario(id: string) {
    return prisma.generatedScenario.delete({
        where: { id },
    })
}
