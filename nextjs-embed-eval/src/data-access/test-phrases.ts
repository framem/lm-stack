import { prisma } from '@/src/lib/prisma'

export async function createTestPhrase(data: {
    phrase: string
    expectedChunkId?: string
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
                    sourceText: { select: { title: true } },
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
    category?: string | null
}) {
    return prisma.testPhrase.update({ where: { id }, data })
}

export async function deleteTestPhrase(id: string) {
    return prisma.testPhrase.delete({ where: { id } })
}

export async function getTestPhrasesWithEmbeddings(modelId: string) {
    return prisma.testPhrase.findMany({
        include: {
            expectedChunk: true,
            phraseEmbeddings: {
                where: { modelId },
            },
        },
    })
}
