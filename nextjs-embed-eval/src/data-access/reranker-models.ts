import { prisma } from '@/src/lib/prisma'

export async function getRerankerModels() {
    return prisma.rerankerModel.findMany({
        orderBy: { createdAt: 'desc' },
    })
}

export async function getRerankerModelById(id: string) {
    return prisma.rerankerModel.findUnique({ where: { id } })
}

export async function createRerankerModel(data: {
    name: string
    provider: string
    providerUrl: string
}) {
    return prisma.rerankerModel.create({ data })
}

export async function deleteRerankerModel(id: string) {
    return prisma.rerankerModel.delete({ where: { id } })
}
