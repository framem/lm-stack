import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/src/lib/prisma', () => ({
    prisma: {
        document: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
        },
        documentChunk: {
            createMany: vi.fn(),
        },
        $queryRawUnsafe: vi.fn(),
    },
}))

import { prisma } from '@/src/lib/prisma'
import {
    createDocument,
    getDocuments,
    getDocumentById,
    getDocumentWithChunks,
    deleteDocument,
    createChunks,
    saveChunkEmbedding,
    findSimilarChunks,
} from '@/src/data-access/documents'

const mockPrisma = vi.mocked(prisma)

beforeEach(() => {
    vi.clearAllMocks()
})

describe('Document CRUD', () => {
    it('should create a document', async () => {
        const docData = {
            title: 'Test',
            fileType: 'text/plain',
            content: 'Hello world',
        }
        const expected = { id: '1', ...docData, createdAt: new Date(), updatedAt: new Date() }
        mockPrisma.document.create.mockResolvedValue(expected as never)

        const result = await createDocument(docData)

        expect(mockPrisma.document.create).toHaveBeenCalledWith({ data: docData })
        expect(result).toEqual(expected)
    })

    it('should list documents with chunk count', async () => {
        const docs = [
            { id: '1', title: 'Doc', _count: { chunks: 3 } },
        ]
        mockPrisma.document.findMany.mockResolvedValue(docs as never)

        const result = await getDocuments()

        expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { chunks: true } } },
        })
        expect(result).toEqual(docs)
    })

    it('should get document by id', async () => {
        const doc = { id: '1', title: 'Test' }
        mockPrisma.document.findUnique.mockResolvedValue(doc as never)

        const result = await getDocumentById('1')

        expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({ where: { id: '1' } })
        expect(result).toEqual(doc)
    })

    it('should get document with chunks', async () => {
        const doc = { id: '1', title: 'Test', chunks: [{ id: 'c1', content: 'chunk' }] }
        mockPrisma.document.findUnique.mockResolvedValue(doc as never)

        const result = await getDocumentWithChunks('1')

        expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({
            where: { id: '1' },
            include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
        })
        expect(result).toEqual(doc)
    })

    it('should delete a document', async () => {
        mockPrisma.document.delete.mockResolvedValue({ id: '1' } as never)

        await deleteDocument('1')

        expect(mockPrisma.document.delete).toHaveBeenCalledWith({ where: { id: '1' } })
    })
})

describe('Chunk operations', () => {
    it('should create chunks in batch', async () => {
        const chunks = [
            { content: 'chunk 1', chunkIndex: 0, pageNumber: 1, tokenCount: 50 },
            { content: 'chunk 2', chunkIndex: 1, pageNumber: 1, tokenCount: 60 },
        ]
        mockPrisma.documentChunk.createMany.mockResolvedValue({ count: 2 } as never)

        await createChunks('doc1', chunks)

        expect(mockPrisma.documentChunk.createMany).toHaveBeenCalledWith({
            data: [
                { documentId: 'doc1', content: 'chunk 1', chunkIndex: 0, pageNumber: 1, tokenCount: 50 },
                { documentId: 'doc1', content: 'chunk 2', chunkIndex: 1, pageNumber: 1, tokenCount: 60 },
            ],
        })
    })

    it('should save chunk embedding with raw SQL', async () => {
        mockPrisma.$queryRawUnsafe.mockResolvedValue(undefined as never)

        await saveChunkEmbedding('c1', [0.1, 0.2, 0.3])

        expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
            `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
            '[0.1,0.2,0.3]',
            'c1'
        )
    })
})

describe('Similarity search', () => {
    it('should find similar chunks without documentId filter', async () => {
        const mockChunks = [{ id: 'c1', content: 'match', documentTitle: 'Doc', similarity: 0.8 }]
        mockPrisma.$queryRawUnsafe.mockResolvedValue(mockChunks as never)

        const result = await findSimilarChunks([0.1, 0.2])

        expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
            expect.stringContaining('ORDER BY c.embedding'),
            '[0.1,0.2]',
            5,
            0.8
        )
        expect(result).toEqual(mockChunks)
    })

    it('should find similar chunks with documentIds filter', async () => {
        const mockChunks = [{ id: 'c1', content: 'match', documentTitle: 'Doc', similarity: 0.9 }]
        mockPrisma.$queryRawUnsafe.mockResolvedValue(mockChunks as never)

        const result = await findSimilarChunks([0.1, 0.2], { topK: 3, documentIds: ['doc1'], threshold: 0.5 })

        expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
            expect.stringContaining('ANY($4::text[])'),
            '[0.1,0.2]',
            3,
            0.5,
            ['doc1']
        )
        expect(result).toEqual(mockChunks)
    })
})
