import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    createTestPhrase,
    getTestPhrases,
    getTestPhraseById,
    updateTestPhrase,
    deleteTestPhrase,
    getPhrasesForRemapping,
    remapPhraseToChunk,
    getTestPhrasesWithEmbeddings,
} from './test-phrases'

vi.mock('@/src/lib/prisma', () => ({
    prisma: {
        testPhrase: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
    },
}))

import { prisma } from '@/src/lib/prisma'

const mockTestPhrase = prisma.testPhrase as unknown as {
    [K in keyof typeof prisma.testPhrase]: ReturnType<typeof vi.fn>
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('createTestPhrase', () => {
    it('should create a phrase with minimal data', async () => {
        const data = { phrase: 'Was ist Embedding?' }
        mockTestPhrase.create.mockResolvedValue({ id: '1', ...data })

        const result = await createTestPhrase(data)

        expect(mockTestPhrase.create).toHaveBeenCalledWith({ data })
        expect(result.phrase).toBe('Was ist Embedding?')
    })

    it('should forward optional fields', async () => {
        const data = {
            phrase: 'Testfrage',
            expectedChunkId: 'chunk-5',
            sourceTextId: 'src-1',
            expectedContent: 'some content',
            category: 'factual',
        }
        mockTestPhrase.create.mockResolvedValue({ id: '2', ...data })

        await createTestPhrase(data)

        expect(mockTestPhrase.create).toHaveBeenCalledWith({ data })
    })
})

describe('getTestPhrases', () => {
    it('should include expected chunk with source text info', async () => {
        mockTestPhrase.findMany.mockResolvedValue([])

        await getTestPhrases()

        expect(mockTestPhrase.findMany).toHaveBeenCalledWith({
            orderBy: { createdAt: 'desc' },
            include: {
                expectedChunk: {
                    select: {
                        id: true,
                        content: true,
                        chunkIndex: true,
                        sourceText: { select: { id: true, title: true } },
                    },
                },
            },
        })
    })
})

describe('getTestPhraseById', () => {
    it('should look up by id with expected chunk info', async () => {
        mockTestPhrase.findUnique.mockResolvedValue({ id: 'p1' })

        await getTestPhraseById('p1')

        expect(mockTestPhrase.findUnique).toHaveBeenCalledWith({
            where: { id: 'p1' },
            include: {
                expectedChunk: {
                    select: {
                        id: true,
                        content: true,
                        chunkIndex: true,
                        sourceText: { select: { title: true } },
                    },
                },
            },
        })
    })
})

describe('updateTestPhrase', () => {
    it('should update phrase text and category', async () => {
        const data = { phrase: 'Neue Frage', category: 'semantic' }
        mockTestPhrase.update.mockResolvedValue({ id: 'p1', ...data })

        await updateTestPhrase('p1', data)

        expect(mockTestPhrase.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data })
    })

    it('should allow setting nullable fields to null', async () => {
        const data = { expectedChunkId: null, category: null }
        mockTestPhrase.update.mockResolvedValue({ id: 'p1', ...data })

        await updateTestPhrase('p1', data)

        expect(mockTestPhrase.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data })
    })
})

describe('deleteTestPhrase', () => {
    it('should delete by id', async () => {
        mockTestPhrase.delete.mockResolvedValue({ id: 'p1' })

        await deleteTestPhrase('p1')

        expect(mockTestPhrase.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
    })
})

describe('getPhrasesForRemapping', () => {
    it('should filter phrases with expectedContent and sourceTextId', async () => {
        mockTestPhrase.findMany.mockResolvedValue([
            { id: 'p1', expectedContent: 'something', sourceTextId: 'src-1' },
        ])

        const result = await getPhrasesForRemapping()

        expect(mockTestPhrase.findMany).toHaveBeenCalledWith({
            where: {
                expectedContent: { not: null },
                sourceTextId: { not: null },
            },
            select: {
                id: true,
                expectedContent: true,
                sourceTextId: true,
            },
        })
        expect(result).toHaveLength(1)
    })
})

describe('remapPhraseToChunk', () => {
    it('should update expectedChunkId for a phrase', async () => {
        mockTestPhrase.update.mockResolvedValue({ id: 'p1', expectedChunkId: 'new-chunk' })

        await remapPhraseToChunk('p1', 'new-chunk')

        expect(mockTestPhrase.update).toHaveBeenCalledWith({
            where: { id: 'p1' },
            data: { expectedChunkId: 'new-chunk' },
        })
    })
})

describe('getTestPhrasesWithEmbeddings', () => {
    it('should include phrase embeddings filtered by modelId', async () => {
        mockTestPhrase.findMany.mockResolvedValue([])

        await getTestPhrasesWithEmbeddings('model-1')

        expect(mockTestPhrase.findMany).toHaveBeenCalledWith({
            include: {
                expectedChunk: {
                    include: {
                        sourceText: { select: { title: true } },
                    },
                },
                phraseEmbeddings: {
                    where: { modelId: 'model-1' },
                },
            },
        })
    })
})
