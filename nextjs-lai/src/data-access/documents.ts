import { prisma } from '@/src/lib/prisma'
import type { Chunk } from '@/src/lib/chunking'

// ---- Document CRUD ----

export async function createDocument(data: {
    title: string
    fileName?: string
    fileType: string
    fileSize?: number
    content: string
}) {
    return prisma.document.create({ data })
}

export async function getDocuments() {
    return prisma.document.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { chunks: true } } },
    })
}

export async function searchDocuments(query: string) {
    return prisma.document.findMany({
        where: {
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { fileName: { contains: query, mode: 'insensitive' } },
                { content: { contains: query, mode: 'insensitive' } },
            ],
        },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { chunks: true } } },
    })
}

export async function getDocumentById(id: string) {
    return prisma.document.findUnique({ where: { id } })
}

export async function getDocumentWithChunks(id: string) {
    return prisma.document.findUnique({
        where: { id },
        include: {
            chunks: { orderBy: { chunkIndex: 'asc' } },
        },
    })
}

export async function updateDocument(id: string, data: { title?: string }) {
    return prisma.document.update({ where: { id }, data })
}

export async function deleteDocument(id: string) {
    return prisma.document.delete({ where: { id } })
}

// ---- Document listing for refresh ----

export async function getDocumentsWithChunkCount() {
    return prisma.document.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            fileName: true,
            _count: { select: { chunks: true } },
        },
    })
}

export async function deleteChunksByDocument(documentId: string) {
    return prisma.documentChunk.deleteMany({ where: { documentId } })
}

// ---- Chunk operations ----

export async function createChunks(documentId: string, chunks: Chunk[]) {
    return prisma.documentChunk.createMany({
        data: chunks.map(chunk => ({
            documentId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            pageNumber: chunk.pageNumber,
            tokenCount: chunk.tokenCount,
        })),
    })
}

export async function saveChunkEmbedding(chunkId: string, embedding: number[]) {
    const vectorString = `[${embedding.join(',')}]`
    await prisma.$queryRawUnsafe(
        `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
        vectorString,
        chunkId
    )
}

export async function saveChunkEmbeddingsBatch(
    embeddings: { chunkId: string; embedding: number[] }[]
) {
    for (const { chunkId, embedding } of embeddings) {
        await saveChunkEmbedding(chunkId, embedding)
    }
}

// ---- Similarity search ----

export interface SimilarChunk {
    id: string
    documentId: string
    documentTitle: string
    content: string
    chunkIndex: number
    pageNumber: number | null
    tokenCount: number | null
    similarity: number
}

export async function findSimilarChunks(
    embedding: number[],
    options: { topK?: number; documentIds?: string[]; threshold?: number } = {}
): Promise<SimilarChunk[]> {
    const { topK = 5, documentIds, threshold = 0.8 } = options
    const vectorString = `[${embedding.join(',')}]`

    if (documentIds && documentIds.length > 0) {
        return prisma.$queryRawUnsafe<SimilarChunk[]>(
            `SELECT c.id, c."documentId", d.title as "documentTitle",
                    c.content, c."chunkIndex", c."pageNumber", c."tokenCount",
                    1 - (c.embedding <=> $1::vector) as similarity
             FROM "DocumentChunk" c
             JOIN "Document" d ON d.id = c."documentId"
             WHERE c.embedding IS NOT NULL
               AND c."documentId" = ANY($4::text[])
               AND (c.embedding <=> $1::vector) < $3
             ORDER BY c.embedding <=> $1::vector
             LIMIT $2`,
            vectorString,
            topK,
            threshold,
            documentIds
        )
    }

    return prisma.$queryRawUnsafe<SimilarChunk[]>(
        `SELECT c.id, c."documentId", d.title as "documentTitle",
                c.content, c."chunkIndex", c."pageNumber", c."tokenCount",
                1 - (c.embedding <=> $1::vector) as similarity
         FROM "DocumentChunk" c
         JOIN "Document" d ON d.id = c."documentId"
         WHERE c.embedding IS NOT NULL
           AND (c.embedding <=> $1::vector) < $3
         ORDER BY c.embedding <=> $1::vector
         LIMIT $2`,
        vectorString,
        topK,
        threshold
    )
}
