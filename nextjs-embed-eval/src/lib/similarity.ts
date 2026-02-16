import { prisma } from '@/src/lib/prisma'
import { truncateEmbedding } from '@/src/lib/embedding'

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
 * Find similar chunks using Matryoshka dimension truncation.
 * Loads all chunk embeddings for the model, truncates to targetDim, and computes
 * cosine similarity client-side (pgvector cannot truncate stored vectors on the fly).
 *
 * NOTE: This loads ALL embeddings for the model into memory. For large corpora
 * (>10k chunks), consider storing pre-truncated embeddings at target dimensions.
 */
export async function findSimilarChunksMatryoshka(
    queryEmbedding: number[],
    modelId: string,
    targetDim: number,
    topK: number = 5
): Promise<SimilarChunk[]> {
    const truncatedQuery = truncateEmbedding(queryEmbedding, targetDim)

    const rows = await prisma.$queryRawUnsafe<Array<{
        chunkId: string
        content: string
        chunkIndex: number
        sourceTitle: string
        embedding: number[]
    }>>(
        `SELECT ce."chunkId", tc.content, tc."chunkIndex",
                st.title AS "sourceTitle",
                ce.embedding
         FROM "ChunkEmbedding" ce
         JOIN "TextChunk" tc ON tc.id = ce."chunkId"
         JOIN "SourceText" st ON st.id = tc."sourceTextId"
         WHERE ce."modelId" = $1`,
        modelId
    )

    // Truncate each chunk embedding and compute cosine similarity
    const scored = rows.map(row => {
        const truncatedChunk = truncateEmbedding(row.embedding, targetDim)
        return {
            chunkId: row.chunkId,
            content: row.content,
            chunkIndex: row.chunkIndex,
            sourceTitle: row.sourceTitle,
            similarity: cosineSimilarity(truncatedQuery, truncatedChunk),
        }
    })

    scored.sort((a, b) => b.similarity - a.similarity)
    return scored.slice(0, topK)
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
    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    if (denominator === 0) return 0
    return dotProduct / denominator
}
