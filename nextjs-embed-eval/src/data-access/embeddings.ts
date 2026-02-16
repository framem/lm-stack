import { prisma } from '@/src/lib/prisma'

// ---- Total counts (model-independent) ----

export async function getTotalChunkCount() {
    return prisma.textChunk.count()
}

export async function getTotalPhraseCount() {
    return prisma.testPhrase.count()
}

// ---- Chunk Embeddings ----

/**
 * Get existing content hashes for chunk embeddings of a given model.
 * Returns a Map<chunkId, contentHash>.
 */
export async function getChunkEmbeddingHashes(
    chunkIds: string[],
    modelId: string
): Promise<Map<string, string | null>> {
    const rows = await prisma.chunkEmbedding.findMany({
        where: { modelId, chunkId: { in: chunkIds } },
        select: { chunkId: true, contentHash: true },
    })
    return new Map(rows.map(r => [r.chunkId, r.contentHash]))
}

export async function saveChunkEmbedding(chunkId: string, modelId: string, embedding: number[], hash?: string) {
    return prisma.chunkEmbedding.upsert({
        where: { chunkId_modelId: { chunkId, modelId } },
        update: { embedding, contentHash: hash ?? null },
        create: { chunkId, modelId, embedding, durationMs: 0, contentHash: hash ?? null },
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
    items: Array<{ chunkId: string; embedding: number[]; contentHash?: string }>,
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
                contentHash: i.contentHash ?? null,
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
