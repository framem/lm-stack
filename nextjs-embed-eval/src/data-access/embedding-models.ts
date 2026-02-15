import { prisma } from '@/src/lib/prisma'

export async function createEmbeddingModel(data: {
    name: string
    provider: string
    providerUrl: string
    dimensions: number
    description?: string
}) {
    return prisma.embeddingModel.create({ data })
}

export async function getEmbeddingModels() {
    return prisma.embeddingModel.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    chunkEmbeddings: true,
                    evalRuns: true,
                },
            },
        },
    })
}

export async function getEmbeddingModelById(id: string) {
    return prisma.embeddingModel.findUnique({ where: { id } })
}

export async function updateEmbeddingModel(id: string, data: {
    name?: string
    provider?: string
    providerUrl?: string
    dimensions?: number
    description?: string
}) {
    return prisma.embeddingModel.update({ where: { id }, data })
}

export async function deleteEmbeddingModel(id: string) {
    return prisma.embeddingModel.delete({ where: { id } })
}
