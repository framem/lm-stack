import { prisma } from '@/src/lib/prisma'

export interface SimilarChunk {
    chunkId: string
    content: string
    chunkIndex: number
    sourceTitle: string
    similarity: number
}

/**
 * Find the most similar chunks to a given embedding vector using pgvector.
 * Uses Float[] → ::vector cast to support any dimension dynamically.
 */
export async function findSimilarChunks(
    embedding: number[],
    modelId: string,
    topK: number = 5
): Promise<SimilarChunk[]> {
    const vectorString = `[${embedding.join(',')}]`

    return prisma.$queryRawUnsafe<SimilarChunk[]>(
        `SELECT ce."chunkId", tc.content, tc."chunkIndex",
                st.title AS "sourceTitle",
                1 - (ce.embedding::vector <=> $1::vector) AS similarity
         FROM "ChunkEmbedding" ce
         JOIN "TextChunk" tc ON tc.id = ce."chunkId"
         JOIN "SourceText" st ON st.id = tc."sourceTextId"
         WHERE ce."modelId" = $2
         ORDER BY ce.embedding::vector <=> $1::vector
         LIMIT $3`,
        vectorString,
        modelId,
        topK
    )
}

/**
 * Compute cosine similarity between two vectors (client-side fallback).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Vector dimensions must match')
    let dotProduct = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
