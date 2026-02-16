import { prisma } from '@/src/lib/prisma'

// ---- Chunk Embeddings ----

export async function saveChunkEmbedding(chunkId: string, modelId: string, embedding: number[]) {
    return prisma.chunkEmbedding.upsert({
        where: { chunkId_modelId: { chunkId, modelId } },
        update: { embedding },
        create: { chunkId, modelId, embedding, durationMs: 0 },
    })
}

export async function getChunkEmbeddingCount(modelId: string) {
    return prisma.chunkEmbedding.count({ where: { modelId } })
}

export async function deleteChunkEmbeddingsByModel(modelId: string) {
    return prisma.chunkEmbedding.deleteMany({ where: { modelId } })
}

// Batch: delete + createMany in a single transaction (faster than individual upserts)
export async function saveChunkEmbeddingsBatch(
    items: Array<{ chunkId: string; embedding: number[] }>,
    modelId: string
) {
    return prisma.$transaction([
        prisma.chunkEmbedding.deleteMany({
            where: {
                modelId,
                chunkId: { in: items.map(i => i.chunkId) },
            },
        }),
        prisma.chunkEmbedding.createMany({
            data: items.map(i => ({
                chunkId: i.chunkId,
                modelId,
                embedding: i.embedding,
                durationMs: 0,
            })),
        }),
    ])
}

// ---- Phrase Embeddings ----

export async function savePhraseEmbedding(phraseId: string, modelId: string, embedding: number[]) {
    return prisma.phraseEmbedding.upsert({
        where: { phraseId_modelId: { phraseId, modelId } },
        update: { embedding },
        create: { phraseId, modelId, embedding, durationMs: 0 },
    })
}

// Batch: delete + createMany in a single transaction (faster than individual upserts)
export async function savePhraseEmbeddingsBatch(
    items: Array<{ phraseId: string; embedding: number[] }>,
    modelId: string
) {
    return prisma.$transaction([
        prisma.phraseEmbedding.deleteMany({
            where: {
                modelId,
                phraseId: { in: items.map(i => i.phraseId) },
            },
        }),
        prisma.phraseEmbedding.createMany({
            data: items.map(i => ({
                phraseId: i.phraseId,
                modelId,
                embedding: i.embedding,
                durationMs: 0,
            })),
        }),
    ])
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
