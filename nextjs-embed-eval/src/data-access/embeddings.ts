import { prisma } from '@/src/lib/prisma'

// ---- Chunk Embeddings ----

export async function saveChunkEmbedding(chunkId: string, modelId: string, embedding: number[]) {
    return prisma.chunkEmbedding.upsert({
        where: { chunkId_modelId: { chunkId, modelId } },
        update: { embedding },
        create: { chunkId, modelId, embedding },
    })
}

export async function getChunkEmbeddingCount(modelId: string) {
    return prisma.chunkEmbedding.count({ where: { modelId } })
}

export async function deleteChunkEmbeddingsByModel(modelId: string) {
    return prisma.chunkEmbedding.deleteMany({ where: { modelId } })
}

// ---- Phrase Embeddings ----

export async function savePhraseEmbedding(phraseId: string, modelId: string, embedding: number[]) {
    return prisma.phraseEmbedding.upsert({
        where: { phraseId_modelId: { phraseId, modelId } },
        update: { embedding },
        create: { phraseId, modelId, embedding },
    })
}

export async function getPhraseEmbeddingCount(modelId: string) {
    return prisma.phraseEmbedding.count({ where: { modelId } })
}

export async function deletePhraseEmbeddingsByModel(modelId: string) {
    return prisma.phraseEmbedding.deleteMany({ where: { modelId } })
}

// ---- Get embedding vectors for evaluation ----

export async function getPhraseEmbeddingVector(phraseId: string, modelId: string) {
    const result = await prisma.phraseEmbedding.findUnique({
        where: { phraseId_modelId: { phraseId, modelId } },
        select: { embedding: true },
    })
    return result?.embedding ?? null
}
