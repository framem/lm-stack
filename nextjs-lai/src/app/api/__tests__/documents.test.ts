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

import { prisma } from '@/src/lib/prisma'
import { createEmbedding } from '@/src/lib/llm'
import { validateFile, parseDocument } from '@/src/lib/document-parser'
import { chunkDocument } from '@/src/lib/chunking'

const mockPrisma = vi.mocked(prisma)
const mockCreateEmbedding = vi.mocked(createEmbedding)
const mockValidateFile = vi.mocked(validateFile)
const mockParseDocument = vi.mocked(parseDocument)
const mockChunkDocument = vi.mocked(chunkDocument)

beforeEach(() => {
    vi.clearAllMocks()
})

describe('GET /api/documents', () => {
    it('should return list of documents', async () => {
        const docs = [
            { id: '1', title: 'Doc 1', _count: { chunks: 2 } },
        ]
        mockPrisma.document.findMany.mockResolvedValue(docs as never)

        const { GET } = await import('@/src/app/api/documents/route')
        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(docs)
    })

    it('should return 500 on error', async () => {
        mockPrisma.document.findMany.mockRejectedValue(new Error('DB error'))

        const { GET } = await import('@/src/app/api/documents/route')
        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBeDefined()
    })
})

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

describe('GET /api/documents/[id]', () => {
    it('should return document with chunks', async () => {
        const doc = { id: '1', title: 'Test', chunks: [{ id: 'c1' }] }
        mockPrisma.document.findUnique.mockResolvedValue(doc as never)

        const { GET } = await import('@/src/app/api/documents/[id]/route')

        const request = new Request('http://localhost/api/documents/1')
        const response = await GET(request as never, { params: Promise.resolve({ id: '1' }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(doc)
    })

    it('should return 404 for missing document', async () => {
        mockPrisma.document.findUnique.mockResolvedValue(null)

        const { GET } = await import('@/src/app/api/documents/[id]/route')

        const request = new Request('http://localhost/api/documents/missing')
        const response = await GET(request as never, { params: Promise.resolve({ id: 'missing' }) })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBeDefined()
    })
})

describe('DELETE /api/documents/[id]', () => {
    it('should delete document and return success', async () => {
        const doc = { id: '1', title: 'Test', chunks: [] }
        mockPrisma.document.findUnique.mockResolvedValue(doc as never)
        mockPrisma.document.delete.mockResolvedValue(doc as never)

        const { DELETE } = await import('@/src/app/api/documents/[id]/route')

        const request = new Request('http://localhost/api/documents/1', { method: 'DELETE' })
        const response = await DELETE(request as never, { params: Promise.resolve({ id: '1' }) })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
    })

    it('should return 404 when deleting non-existent document', async () => {
        mockPrisma.document.findUnique.mockResolvedValue(null)

        const { DELETE } = await import('@/src/app/api/documents/[id]/route')

        const request = new Request('http://localhost/api/documents/missing', { method: 'DELETE' })
        const response = await DELETE(request as never, { params: Promise.resolve({ id: 'missing' }) })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBeDefined()
    })
})
