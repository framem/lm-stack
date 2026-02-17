import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    createSourceText,
    getSourceTexts,
    getSourceTextById,
    getSourceTextWithChunks,
    updateSourceText,
    deleteSourceText,
    createChunks,
    getChunksBySourceText,
    getAllChunks,
    deleteChunksBySourceText,
} from './source-texts'

vi.mock('@/src/lib/prisma', () => ({
    prisma: {
        sourceText: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        textChunk: {
            createMany: vi.fn(),
            findMany: vi.fn(),
            deleteMany: vi.fn(),
        },
    },
}))

import { prisma } from '@/src/lib/prisma'

const mockSourceText = prisma.sourceText as unknown as {
    [K in keyof typeof prisma.sourceText]: ReturnType<typeof vi.fn>
}
const mockTextChunk = prisma.textChunk as unknown as {
    [K in keyof typeof prisma.textChunk]: ReturnType<typeof vi.fn>
}

beforeEach(() => {
    vi.clearAllMocks()
})

// ---- SourceText CRUD ----

describe('createSourceText', () => {
    it('should call prisma.sourceText.create with the given data', async () => {
        const data = { title: 'Test', content: 'Hello world' }
        const created = { id: '1', ...data, createdAt: new Date() }
        mockSourceText.create.mockResolvedValue(created)

        const result = await createSourceText(data)

        expect(mockSourceText.create).toHaveBeenCalledWith({ data })
        expect(result).toBe(created)
    })

    it('should forward optional chunking parameters', async () => {
        const data = { title: 'Test', content: 'Body', chunkSize: 512, chunkOverlap: 64, chunkStrategy: 'fixed' }
        mockSourceText.create.mockResolvedValue({ id: '2', ...data })

        await createSourceText(data)

        expect(mockSourceText.create).toHaveBeenCalledWith({ data })
    })
})

describe('getSourceTexts', () => {
    it('should return texts ordered by createdAt desc with chunk counts', async () => {
        const texts = [{ id: '1', title: 'A', _count: { chunks: 3 } }]
        mockSourceText.findMany.mockResolvedValue(texts)

        const result = await getSourceTexts()

        expect(mockSourceText.findMany).toHaveBeenCalledWith({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { chunks: true } } },
        })
        expect(result).toBe(texts)
    })
})

describe('getSourceTextById', () => {
    it('should look up by id', async () => {
        mockSourceText.findUnique.mockResolvedValue({ id: 'abc' })

        await getSourceTextById('abc')

        expect(mockSourceText.findUnique).toHaveBeenCalledWith({ where: { id: 'abc' } })
    })

    it('should return null for unknown id', async () => {
        mockSourceText.findUnique.mockResolvedValue(null)

        const result = await getSourceTextById('unknown')

        expect(result).toBeNull()
    })
})

describe('getSourceTextWithChunks', () => {
    it('should include chunks ordered by chunkIndex', async () => {
        mockSourceText.findUnique.mockResolvedValue({ id: '1', chunks: [] })

        await getSourceTextWithChunks('1')

        expect(mockSourceText.findUnique).toHaveBeenCalledWith({
            where: { id: '1' },
            include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
        })
    })
})

describe('updateSourceText', () => {
    it('should update chunking parameters', async () => {
        const data = { chunkSize: 256, chunkOverlap: 32 }
        mockSourceText.update.mockResolvedValue({ id: '1', ...data })

        await updateSourceText('1', data)

        expect(mockSourceText.update).toHaveBeenCalledWith({ where: { id: '1' }, data })
    })
})

describe('deleteSourceText', () => {
    it('should delete by id', async () => {
        mockSourceText.delete.mockResolvedValue({ id: '1' })

        await deleteSourceText('1')

        expect(mockSourceText.delete).toHaveBeenCalledWith({ where: { id: '1' } })
    })
})

// ---- TextChunk operations ----

describe('createChunks', () => {
    it('should map Chunk[] to createMany data with sourceTextId', async () => {
        const chunks = [
            { content: 'First chunk', chunkIndex: 0, tokenCount: 10 },
            { content: 'Second chunk', chunkIndex: 1, tokenCount: 15 },
        ]
        mockTextChunk.createMany.mockResolvedValue({ count: 2 })

        await createChunks('src-1', chunks)

        expect(mockTextChunk.createMany).toHaveBeenCalledWith({
            data: [
                {
                    sourceTextId: 'src-1',
                    content: 'First chunk',
                    chunkIndex: 0,
                    tokenCount: 10,
                    contentHash: 'd4c3ad047de841268dfa59da3a61873c491bb56fdf52d65e6aa45ece3c70d972',
                },
                {
                    sourceTextId: 'src-1',
                    content: 'Second chunk',
                    chunkIndex: 1,
                    tokenCount: 15,
                    contentHash: '4dfedc641158b8c314dd07950d12397a47f59ff0276340d8bf43702945773672',
                },
            ],
        })
    })

    it('should handle empty chunk array', async () => {
        mockTextChunk.createMany.mockResolvedValue({ count: 0 })

        await createChunks('src-1', [])

        expect(mockTextChunk.createMany).toHaveBeenCalledWith({ data: [] })
    })
})

describe('getChunksBySourceText', () => {
    it('should filter by sourceTextId and order by chunkIndex', async () => {
        mockTextChunk.findMany.mockResolvedValue([])

        await getChunksBySourceText('src-1')

        expect(mockTextChunk.findMany).toHaveBeenCalledWith({
            where: { sourceTextId: 'src-1' },
            orderBy: { chunkIndex: 'asc' },
        })
    })
})

describe('getAllChunks', () => {
    it('should order by sourceTextId then chunkIndex and include source title', async () => {
        mockTextChunk.findMany.mockResolvedValue([])

        await getAllChunks()

        expect(mockTextChunk.findMany).toHaveBeenCalledWith({
            orderBy: [{ sourceTextId: 'asc' }, { chunkIndex: 'asc' }],
            include: { sourceText: { select: { title: true } } },
        })
    })
})

describe('deleteChunksBySourceText', () => {
    it('should delete all chunks for a source text', async () => {
        mockTextChunk.deleteMany.mockResolvedValue({ count: 5 })

        const result = await deleteChunksBySourceText('src-1')

        expect(mockTextChunk.deleteMany).toHaveBeenCalledWith({ where: { sourceTextId: 'src-1' } })
        expect(result).toEqual({ count: 5 })
    })
})
