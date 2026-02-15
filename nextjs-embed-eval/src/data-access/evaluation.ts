import { prisma } from '@/src/lib/prisma'

// ---- EvalRun CRUD ----

export async function createEvalRun(data: {
    modelId: string
    avgSimilarity?: number
    topKAccuracy1?: number
    topKAccuracy3?: number
    topKAccuracy5?: number
    mrrScore?: number
    ndcgScore?: number
    chunkSize?: number
    chunkOverlap?: number
    chunkStrategy?: string
    totalChunks?: number
    totalPhrases?: number
}) {
    return prisma.evalRun.create({ data })
}

export async function updateEvalRun(id: string, data: {
    avgSimilarity?: number
    topKAccuracy1?: number
    topKAccuracy3?: number
    topKAccuracy5?: number
    mrrScore?: number
    ndcgScore?: number
    chunkSize?: number
    chunkOverlap?: number
    chunkStrategy?: string
    totalChunks?: number
    totalPhrases?: number
}) {
    return prisma.evalRun.update({ where: { id }, data })
}

export async function getEvalRuns() {
    return prisma.evalRun.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            model: { select: { name: true, dimensions: true } },
            _count: { select: { results: true } },
        },
    })
}

export async function getEvalRunById(id: string) {
    return prisma.evalRun.findUnique({
        where: { id },
        include: {
            model: true,
            results: {
                include: {
                    phrase: {
                        include: {
                            expectedChunk: {
                                select: { content: true, chunkIndex: true },
                            },
                        },
                    },
                },
            },
        },
    })
}

export async function getEvalRunsByModel(modelId: string) {
    return prisma.evalRun.findMany({
        where: { modelId },
        orderBy: { createdAt: 'desc' },
        include: {
            model: { select: { name: true } },
            _count: { select: { results: true } },
        },
    })
}

export async function getLatestEvalRuns(limit: number = 5) {
    return prisma.evalRun.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            model: { select: { name: true, dimensions: true } },
            _count: { select: { results: true } },
        },
    })
}

// ---- EvalResult ----

export async function createEvalResult(data: {
    runId: string
    phraseId: string
    retrievedChunkIds: string[]
    similarities: number[]
    expectedChunkRank: number | null
    isHit: boolean
}) {
    return prisma.evalResult.create({ data })
}

export async function getEvalResultsByRun(runId: string) {
    return prisma.evalResult.findMany({
        where: { runId },
        include: {
            phrase: {
                include: {
                    expectedChunk: {
                        select: { content: true, chunkIndex: true },
                    },
                },
            },
        },
    })
}

// ---- Comparison data ----

/**
 * Get latest eval run per model (legacy behavior).
 */
export async function getComparisonData(modelIds: string[]) {
    return prisma.evalRun.findMany({
        where: { modelId: { in: modelIds } },
        orderBy: { createdAt: 'desc' },
        distinct: ['modelId'],
        include: {
            model: { select: { id: true, name: true, dimensions: true, provider: true } },
        },
    })
}

/**
 * Get all eval runs (with chunk config) for full history comparison.
 */
export async function getAllEvalRuns(modelIds?: string[]) {
    return prisma.evalRun.findMany({
        where: modelIds ? { modelId: { in: modelIds } } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            model: { select: { id: true, name: true, dimensions: true, provider: true } },
            _count: { select: { results: true } },
        },
    })
}
