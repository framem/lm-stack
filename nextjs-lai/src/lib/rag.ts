import { createEmbedding } from '@/src/lib/llm'
import { findSimilarChunks } from '@/src/data-access/documents'

export interface RetrievedContext {
    id: string
    content: string
    documentId: string
    documentTitle: string
    pageNumber: number | null
    chunkIndex: number
    similarity: number
}

interface RetrieveOptions {
    topK?: number
    documentId?: string
    threshold?: number
}

// Retrieve relevant context chunks for a given query
export async function retrieveContext(
    query: string,
    options: RetrieveOptions = {}
): Promise<RetrievedContext[]> {
    const { topK = 5, documentId, threshold = 0.5 } = options

    const embedding = await createEmbedding(query)

    const chunks = await findSimilarChunks(embedding, {
        topK,
        documentId,
        threshold,
    })

    return chunks.map((chunk) => ({
        id: chunk.id,
        content: chunk.content,
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        similarity: chunk.similarity,
    }))
}

// Build a numbered context prompt for the LLM with [Quelle N] markers
export function buildContextPrompt(contexts: RetrievedContext[]): string {
    if (contexts.length === 0) {
        return 'Kein relevanter Kontext gefunden.'
    }

    const blocks = contexts.map((ctx, i) => {
        const pageInfo = ctx.pageNumber != null ? `, Seite: ${ctx.pageNumber}` : ''
        return `[Quelle ${i + 1}] (Dokument: "${ctx.documentTitle}"${pageInfo}):\n${ctx.content}`
    })

    return blocks.join('\n\n')
}

export interface Citation {
    index: number
    documentId: string
    documentTitle: string
    pageNumber: number | null
    chunkId: string
    snippet: string
    content: string
}

// Extract citation markers ([Quelle N]) from the LLM response text
export function extractCitations(
    text: string,
    contexts: RetrievedContext[]
): Citation[] {
    const pattern = /\[Quelle\s+(\d+)\]/g
    const found = new Set<number>()
    let match: RegExpExecArray | null

    while ((match = pattern.exec(text)) !== null) {
        const idx = parseInt(match[1], 10)
        if (idx >= 1 && idx <= contexts.length) {
            found.add(idx)
        }
    }

    return Array.from(found)
        .sort((a, b) => a - b)
        .map((idx) => {
            const ctx = contexts[idx - 1]
            return {
                index: idx,
                documentId: ctx.documentId,
                documentTitle: ctx.documentTitle,
                pageNumber: ctx.pageNumber,
                chunkId: ctx.id,
                snippet: ctx.content.slice(0, 200),
                content: ctx.content,
            }
        })
}
