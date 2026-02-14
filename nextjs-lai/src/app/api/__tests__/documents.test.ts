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
            findMany: vi.fn(),
        },
        $queryRawUnsafe: vi.fn(),
    },
}))

vi.mock('@/src/lib/llm', () => ({
    createEmbedding: vi.fn(),
    getModel: vi.fn(() => ({})),
}))

vi.mock('@/src/lib/document-parser', () => ({
    validateFile: vi.fn(),
    parseDocument: vi.fn(),
}))

vi.mock('@/src/lib/chunking', () => ({
    chunkDocument: vi.fn(),
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

import { prisma } from '@/src/lib/prisma'
import { createEmbedding } from '@/src/lib/llm'
import { chunkDocument } from '@/src/lib/chunking'

const mockPrisma = vi.mocked(prisma)
const mockCreateEmbedding = vi.mocked(createEmbedding)
const mockChunkDocument = vi.mocked(chunkDocument)

beforeEach(() => {
    vi.clearAllMocks()
})

// ── Server Action tests ──

describe('getDocuments server action', () => {
    it('should return list of documents', async () => {
        const docs = [
            { id: '1', title: 'Doc 1', _count: { chunks: 2 } },
        ]
        mockPrisma.document.findMany.mockResolvedValue(docs as never)

        const { getDocuments } = await import('@/src/actions/documents')
        const data = await getDocuments()

        expect(data).toEqual(docs)
    })
})

describe('getDocument server action', () => {
    it('should return document with chunks', async () => {
        const doc = { id: '1', title: 'Test', chunks: [{ id: 'c1' }] }
        mockPrisma.document.findUnique.mockResolvedValue(doc as never)

        const { getDocument } = await import('@/src/actions/documents')
        const data = await getDocument('1')

        expect(data).toEqual(doc)
    })

    it('should throw for missing document', async () => {
        mockPrisma.document.findUnique.mockResolvedValue(null)

        const { getDocument } = await import('@/src/actions/documents')

        await expect(getDocument('missing')).rejects.toThrow('Dokument nicht gefunden.')
    })
})

describe('deleteDocument server action', () => {
    it('should delete document', async () => {
        const doc = { id: '1', title: 'Test', chunks: [] }
        mockPrisma.document.findUnique.mockResolvedValue(doc as never)
        mockPrisma.document.delete.mockResolvedValue(doc as never)

        const { deleteDocument } = await import('@/src/actions/documents')

        await expect(deleteDocument('1')).resolves.toBeUndefined()
        expect(mockPrisma.document.delete).toHaveBeenCalled()
    })

    it('should throw when deleting non-existent document', async () => {
        mockPrisma.document.findUnique.mockResolvedValue(null)

        const { deleteDocument } = await import('@/src/actions/documents')

        await expect(deleteDocument('missing')).rejects.toThrow('Dokument nicht gefunden.')
    })
})

// ── API route tests (POST only — SSE upload pipeline) ──

describe('POST /api/documents', () => {
    it('should reject request without file or text', async () => {
        const { POST } = await import('@/src/app/api/documents/route')

        const request = new Request('http://localhost/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        })

        const response = await POST(request as never)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBeDefined()
    })

    it('should process text paste and return SSE stream', async () => {
        const doc = { id: 'doc1', title: 'Test' }
        mockPrisma.document.create.mockResolvedValue(doc as never)
        mockChunkDocument.mockReturnValue([
            { content: 'chunk 1', chunkIndex: 0, pageNumber: null, tokenCount: 50 },
        ])
        mockPrisma.documentChunk.createMany.mockResolvedValue({ count: 1 } as never)
        mockPrisma.documentChunk.findMany.mockResolvedValue([
            { id: 'c1', content: 'chunk 1' },
        ] as never)
        mockCreateEmbedding.mockResolvedValue([0.1, 0.2, 0.3])
        mockPrisma.$queryRawUnsafe.mockResolvedValue(undefined as never)

        const { POST } = await import('@/src/app/api/documents/route')

        const request = new Request('http://localhost/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'Some test content', title: 'Test' }),
        })

        const response = await POST(request as never)

        expect(response.headers.get('Content-Type')).toBe('text/event-stream')

        // Read stream to completion
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let fullText = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullText += decoder.decode(value, { stream: true })
        }

        expect(fullText).toContain('"type":"complete"')
        expect(fullText).toContain('"documentId":"doc1"')
    })
})
