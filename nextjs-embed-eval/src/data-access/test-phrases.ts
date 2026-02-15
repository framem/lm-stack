import { prisma } from '@/src/lib/prisma'

export async function createTestPhrase(data: {
    phrase: string
    expectedChunkId?: string
    sourceTextId?: string
    expectedContent?: string
    category?: string
}) {
    return prisma.testPhrase.create({ data })
}

export async function getTestPhrases() {
    return prisma.testPhrase.findMany({
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
}

export async function getTestPhraseById(id: string) {
    return prisma.testPhrase.findUnique({
        where: { id },
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
}

export async function updateTestPhrase(id: string, data: {
    phrase?: string
    expectedChunkId?: string | null
    sourceTextId?: string | null
    expectedContent?: string | null
    category?: string | null
}) {
    return prisma.testPhrase.update({ where: { id }, data })
}

export async function deleteTestPhrase(id: string) {
    return prisma.testPhrase.delete({ where: { id } })
}

/**
 * Get all phrases that have expectedContent stored (for auto-remapping after re-chunking).
 */
export async function getPhrasesForRemapping() {
    return prisma.testPhrase.findMany({
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
}

/**
 * Bulk update phrase → chunk mappings after re-chunking.
 */
export async function remapPhraseToChunk(phraseId: string, newChunkId: string) {
    return prisma.testPhrase.update({
        where: { id: phraseId },
        data: { expectedChunkId: newChunkId },
    })
}

export async function getTestPhrasesWithEmbeddings(modelId: string) {
    return prisma.testPhrase.findMany({
        include: {
            expectedChunk: {
                include: {
                    sourceText: { select: { title: true } },
                },
            },
            phraseEmbeddings: {
                where: { modelId },
            },
        },
    })
}
