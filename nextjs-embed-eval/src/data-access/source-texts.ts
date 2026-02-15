import { prisma } from '@/src/lib/prisma'
import type { Chunk } from '@/src/lib/chunking'

// ---- SourceText CRUD ----

export async function createSourceText(data: { title: string; content: string; chunkSize?: number; chunkOverlap?: number }) {
    return prisma.sourceText.create({ data })
}

export async function getSourceTexts() {
    return prisma.sourceText.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { chunks: true } } },
    })
}

export async function getSourceTextById(id: string) {
    return prisma.sourceText.findUnique({ where: { id } })
}

export async function getSourceTextWithChunks(id: string) {
    return prisma.sourceText.findUnique({
        where: { id },
        include: {
            chunks: { orderBy: { chunkIndex: 'asc' } },
        },
    })
}

export async function updateSourceText(id: string, data: { chunkSize?: number; chunkOverlap?: number }) {
    return prisma.sourceText.update({ where: { id }, data })
}

export async function deleteSourceText(id: string) {
    return prisma.sourceText.delete({ where: { id } })
}

// ---- TextChunk operations ----

export async function createChunks(sourceTextId: string, chunks: Chunk[]) {
    return prisma.textChunk.createMany({
        data: chunks.map(chunk => ({
            sourceTextId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            tokenCount: chunk.tokenCount,
        })),
    })
}

export async function getChunksBySourceText(sourceTextId: string) {
    return prisma.textChunk.findMany({
        where: { sourceTextId },
        orderBy: { chunkIndex: 'asc' },
    })
}

export async function getAllChunks() {
    return prisma.textChunk.findMany({
        orderBy: [{ sourceTextId: 'asc' }, { chunkIndex: 'asc' }],
        include: { sourceText: { select: { title: true } } },
    })
}

export async function deleteChunksBySourceText(sourceTextId: string) {
    return prisma.textChunk.deleteMany({ where: { sourceTextId } })
}
