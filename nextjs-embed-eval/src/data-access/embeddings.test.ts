import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    saveChunkEmbedding,
    saveChunkEmbeddingsBatch,
    getChunkEmbeddingCount,
    deleteChunkEmbeddingsByModel,
    savePhraseEmbedding,
    savePhraseEmbeddingsBatch,
    getPhraseEmbeddingCount,
    deletePhraseEmbeddingsByModel,
    getPhraseEmbeddingVector,
} from './embeddings'

vi.mock('@/src/lib/prisma', () => ({
    prisma: {
        chunkEmbedding: {
            upsert: vi.fn(),
            count: vi.fn(),
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        phraseEmbedding: {
            upsert: vi.fn(),
            count: vi.fn(),
            deleteMany: vi.fn(),
            createMany: vi.fn(),
            findUnique: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

import { prisma } from '@/src/lib/prisma'

const mockChunkEmb = prisma.chunkEmbedding as unknown as Record<string, ReturnType<typeof vi.fn>>
const mockPhraseEmb = prisma.phraseEmbedding as unknown as Record<string, ReturnType<typeof vi.fn>>
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
    vi.clearAllMocks()
})

// ---- Chunk Embeddings ----

describe('saveChunkEmbedding', () => {
    it('should upsert with composite key chunkId_modelId', async () => {
        const embedding = [0.1, 0.2, 0.3]
        mockChunkEmb.upsert.mockResolvedValue({ id: '1' })

        await saveChunkEmbedding('chunk-1', 'model-1', embedding)

        expect(mockChunkEmb.upsert).toHaveBeenCalledWith({
            where: { chunkId_modelId: { chunkId: 'chunk-1', modelId: 'model-1' } },
            update: { embedding },
            create: { chunkId: 'chunk-1', modelId: 'model-1', embedding, durationMs: 0 },
        })
    })
})

describe('saveChunkEmbeddingsBatch', () => {
    it('should execute delete + createMany in a transaction', async () => {
        const items = [
            { chunkId: 'c1', embedding: [0.1] },
            { chunkId: 'c2', embedding: [0.2] },
        ]
        const deletePromise = Promise.resolve({ count: 2 })
        const createPromise = Promise.resolve({ count: 2 })
        mockChunkEmb.deleteMany.mockReturnValue(deletePromise)
        mockChunkEmb.createMany.mockReturnValue(createPromise)
        mockTransaction.mockResolvedValue([{ count: 2 }, { count: 2 }])

        await saveChunkEmbeddingsBatch(items, 'model-1')

        expect(mockChunkEmb.deleteMany).toHaveBeenCalledWith({
            where: { modelId: 'model-1', chunkId: { in: ['c1', 'c2'] } },
        })
        expect(mockChunkEmb.createMany).toHaveBeenCalledWith({
            data: [
                { chunkId: 'c1', modelId: 'model-1', embedding: [0.1], durationMs: 0 },
                { chunkId: 'c2', modelId: 'model-1', embedding: [0.2], durationMs: 0 },
            ],
        })
        expect(mockTransaction).toHaveBeenCalledWith([deletePromise, createPromise])
    })
})

describe('getChunkEmbeddingCount', () => {
    it('should count embeddings for a model', async () => {
        mockChunkEmb.count.mockResolvedValue(42)

        const result = await getChunkEmbeddingCount('model-1')

        expect(mockChunkEmb.count).toHaveBeenCalledWith({ where: { modelId: 'model-1' } })
        expect(result).toBe(42)
    })
})

describe('deleteChunkEmbeddingsByModel', () => {
    it('should delete all chunk embeddings for a model', async () => {
        mockChunkEmb.deleteMany.mockResolvedValue({ count: 10 })

        await deleteChunkEmbeddingsByModel('model-1')

        expect(mockChunkEmb.deleteMany).toHaveBeenCalledWith({ where: { modelId: 'model-1' } })
    })
})

// ---- Phrase Embeddings ----

describe('savePhraseEmbedding', () => {
    it('should upsert with composite key phraseId_modelId', async () => {
        const embedding = [0.5, 0.6]
        mockPhraseEmb.upsert.mockResolvedValue({ id: '1' })

        await savePhraseEmbedding('phrase-1', 'model-1', embedding)

        expect(mockPhraseEmb.upsert).toHaveBeenCalledWith({
            where: { phraseId_modelId: { phraseId: 'phrase-1', modelId: 'model-1' } },
            update: { embedding },
            create: { phraseId: 'phrase-1', modelId: 'model-1', embedding, durationMs: 0 },
        })
    })
})

describe('savePhraseEmbeddingsBatch', () => {
    it('should execute delete + createMany in a transaction', async () => {
        const items = [{ phraseId: 'p1', embedding: [0.1] }]
        const deletePromise = Promise.resolve({ count: 1 })
        const createPromise = Promise.resolve({ count: 1 })
        mockPhraseEmb.deleteMany.mockReturnValue(deletePromise)
        mockPhraseEmb.createMany.mockReturnValue(createPromise)
        mockTransaction.mockResolvedValue([{ count: 1 }, { count: 1 }])

        await savePhraseEmbeddingsBatch(items, 'model-1')

        expect(mockPhraseEmb.deleteMany).toHaveBeenCalledWith({
            where: { modelId: 'model-1', phraseId: { in: ['p1'] } },
        })
        expect(mockPhraseEmb.createMany).toHaveBeenCalledWith({
            data: [{ phraseId: 'p1', modelId: 'model-1', embedding: [0.1], durationMs: 0 }],
        })
        expect(mockTransaction).toHaveBeenCalledWith([deletePromise, createPromise])
    })
})

describe('getPhraseEmbeddingCount', () => {
    it('should count phrase embeddings for a model', async () => {
        mockPhraseEmb.count.mockResolvedValue(7)

        const result = await getPhraseEmbeddingCount('model-1')

        expect(mockPhraseEmb.count).toHaveBeenCalledWith({ where: { modelId: 'model-1' } })
        expect(result).toBe(7)
    })
})

describe('deletePhraseEmbeddingsByModel', () => {
    it('should delete all phrase embeddings for a model', async () => {
        mockPhraseEmb.deleteMany.mockResolvedValue({ count: 3 })

        await deletePhraseEmbeddingsByModel('model-1')

        expect(mockPhraseEmb.deleteMany).toHaveBeenCalledWith({ where: { modelId: 'model-1' } })
    })
})

// ---- Embedding Vector Retrieval ----

describe('getPhraseEmbeddingVector', () => {
    it('should return the embedding array when found', async () => {
        const embedding = [0.1, 0.2, 0.3]
        mockPhraseEmb.findUnique.mockResolvedValue({ embedding })

        const result = await getPhraseEmbeddingVector('phrase-1', 'model-1')

        expect(mockPhraseEmb.findUnique).toHaveBeenCalledWith({
            where: { phraseId_modelId: { phraseId: 'phrase-1', modelId: 'model-1' } },
            select: { embedding: true },
        })
        expect(result).toEqual(embedding)
    })

    it('should return null when no embedding exists', async () => {
        mockPhraseEmb.findUnique.mockResolvedValue(null)

        const result = await getPhraseEmbeddingVector('missing', 'model-1')

        expect(result).toBeNull()
    })
})
