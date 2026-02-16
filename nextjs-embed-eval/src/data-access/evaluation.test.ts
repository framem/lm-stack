import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    createEvalRun,
    updateEvalRun,
    getEvalRuns,
    getEvalRunById,
    getEvalRunsByModel,
    getLatestEvalRuns,
    createEvalResult,
    getEvalResultsByRun,
    getComparisonData,
    getAllEvalRuns,
} from './evaluation'

vi.mock('@/src/lib/prisma', () => ({
    prisma: {
        evalRun: {
            create: vi.fn(),
            update: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        evalResult: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
    },
}))

import { prisma } from '@/src/lib/prisma'

const mockEvalRun = prisma.evalRun as unknown as Record<string, ReturnType<typeof vi.fn>>
const mockEvalResult = prisma.evalResult as unknown as Record<string, ReturnType<typeof vi.fn>>

beforeEach(() => {
    vi.clearAllMocks()
})

// ---- EvalRun ----

describe('createEvalRun', () => {
    it('should create a run with model reference and metrics', async () => {
        const data = { modelId: 'model-1', avgSimilarity: 0.85, topKAccuracy1: 0.7 }
        mockEvalRun.create.mockResolvedValue({ id: 'run-1', ...data })

        const result = await createEvalRun(data)

        expect(mockEvalRun.create).toHaveBeenCalledWith({ data })
        expect(result.id).toBe('run-1')
    })

    it('should accept optional chunk config fields', async () => {
        const data = {
            modelId: 'model-1',
            chunkSize: 512,
            chunkOverlap: 64,
            chunkStrategy: 'fixed',
            totalChunks: 20,
            totalPhrases: 10,
        }
        mockEvalRun.create.mockResolvedValue({ id: 'run-2', ...data })

        await createEvalRun(data)

        expect(mockEvalRun.create).toHaveBeenCalledWith({ data })
    })
})

describe('updateEvalRun', () => {
    it('should update computed metrics after evaluation', async () => {
        const metrics = {
            avgSimilarity: 0.82,
            topKAccuracy1: 0.6,
            topKAccuracy3: 0.8,
            topKAccuracy5: 0.9,
            mrrScore: 0.75,
            ndcgScore: 0.78,
        }
        mockEvalRun.update.mockResolvedValue({ id: 'run-1', ...metrics })

        await updateEvalRun('run-1', metrics)

        expect(mockEvalRun.update).toHaveBeenCalledWith({ where: { id: 'run-1' }, data: metrics })
    })
})

describe('getEvalRuns', () => {
    it('should include model name, reranker name, and result counts', async () => {
        mockEvalRun.findMany.mockResolvedValue([])

        await getEvalRuns()

        expect(mockEvalRun.findMany).toHaveBeenCalledWith({
            orderBy: { createdAt: 'desc' },
            include: {
                model: { select: { name: true, dimensions: true } },
                reranker: { select: { name: true } },
                _count: { select: { results: true } },
            },
        })
    })
})

describe('getEvalRunById', () => {
    it('should include full model, results with phrase and expected chunk', async () => {
        mockEvalRun.findUnique.mockResolvedValue({ id: 'run-1', results: [] })

        await getEvalRunById('run-1')

        expect(mockEvalRun.findUnique).toHaveBeenCalledWith({
            where: { id: 'run-1' },
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
    })
})

describe('getEvalRunsByModel', () => {
    it('should filter by modelId', async () => {
        mockEvalRun.findMany.mockResolvedValue([])

        await getEvalRunsByModel('model-1')

        expect(mockEvalRun.findMany).toHaveBeenCalledWith({
            where: { modelId: 'model-1' },
            orderBy: { createdAt: 'desc' },
            include: {
                model: { select: { name: true } },
                _count: { select: { results: true } },
            },
        })
    })
})

describe('getLatestEvalRuns', () => {
    it('should use default limit of 5', async () => {
        mockEvalRun.findMany.mockResolvedValue([])

        await getLatestEvalRuns()

        expect(mockEvalRun.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 5 }),
        )
    })

    it('should accept a custom limit', async () => {
        mockEvalRun.findMany.mockResolvedValue([])

        await getLatestEvalRuns(10)

        expect(mockEvalRun.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: 10 }),
        )
    })
})

// ---- EvalResult ----

describe('createEvalResult', () => {
    it('should store per-phrase result with similarities and hit status', async () => {
        const data = {
            runId: 'run-1',
            phraseId: 'phrase-1',
            retrievedChunkIds: ['c1', 'c2', 'c3'],
            similarities: [0.95, 0.80, 0.70],
            expectedChunkRank: 1,
            isHit: true,
        }
        mockEvalResult.create.mockResolvedValue({ id: 'res-1', ...data })

        const result = await createEvalResult(data)

        expect(mockEvalResult.create).toHaveBeenCalledWith({ data })
        expect(result.isHit).toBe(true)
    })

    it('should handle null expectedChunkRank for misses', async () => {
        const data = {
            runId: 'run-1',
            phraseId: 'phrase-2',
            retrievedChunkIds: ['c5'],
            similarities: [0.3],
            expectedChunkRank: null,
            isHit: false,
        }
        mockEvalResult.create.mockResolvedValue({ id: 'res-2', ...data })

        await createEvalResult(data)

        expect(mockEvalResult.create).toHaveBeenCalledWith({ data })
    })
})

describe('getEvalResultsByRun', () => {
    it('should include phrase with expected chunk details', async () => {
        mockEvalResult.findMany.mockResolvedValue([])

        await getEvalResultsByRun('run-1')

        expect(mockEvalResult.findMany).toHaveBeenCalledWith({
            where: { runId: 'run-1' },
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
    })
})

// ---- Comparison ----

describe('getComparisonData', () => {
    it('should return latest run per model using distinct', async () => {
        mockEvalRun.findMany.mockResolvedValue([])

        await getComparisonData(['model-1', 'model-2'])

        expect(mockEvalRun.findMany).toHaveBeenCalledWith({
            where: { modelId: { in: ['model-1', 'model-2'] } },
            orderBy: { createdAt: 'desc' },
            distinct: ['modelId'],
            include: {
                model: { select: { id: true, name: true, dimensions: true, provider: true, lastEmbedDurationMs: true } },
            },
        })
    })
})

describe('getAllEvalRuns', () => {
    it('should return all runs when no modelIds provided', async () => {
        mockEvalRun.findMany.mockResolvedValue([])

        await getAllEvalRuns()

        expect(mockEvalRun.findMany).toHaveBeenCalledWith({
            where: undefined,
            orderBy: { createdAt: 'desc' },
            include: {
                model: { select: { id: true, name: true, dimensions: true, provider: true, lastEmbedDurationMs: true } },
                reranker: { select: { name: true } },
                _count: { select: { results: true } },
            },
        })
    })

    it('should filter by modelIds when provided', async () => {
        mockEvalRun.findMany.mockResolvedValue([])

        await getAllEvalRuns(['model-1'])

        expect(mockEvalRun.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { modelId: { in: ['model-1'] } },
            }),
        )
    })
})
