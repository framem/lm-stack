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
    documentIds?: string[]
    threshold?: number
}

// Retrieve relevant context chunks for a given query
export async function retrieveContext(
    query: string,
    options: RetrieveOptions = {}
): Promise<RetrievedContext[]> {
    const { topK = 5, documentIds, threshold = 0.5 } = options

    const embedding = await createEmbedding(query)

    const chunks = await findSimilarChunks(embedding, {
        topK,
        documentIds,
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

// Extract citation markers ([Quelle N]) from the LLM response text.
// Also handles common LLM deviations: missing brackets, en-dash ranges, hyphen ranges.
export function extractCitations(
    text: string,
    contexts: RetrievedContext[]
): Citation[] {
    const found = new Set<number>()

    const addIfValid = (n: number) => {
        if (n >= 1 && n <= contexts.length) found.add(n)
    }

    // 1. Standard individual markers: [Quelle 1], [Quelle 2]
    for (const m of text.matchAll(/\[Quelle\s+(\d+)\]/g)) {
        addIfValid(parseInt(m[1], 10))
    }

    // 2. Bare markers without brackets: Quelle 1 (but not inside [...])
    for (const m of text.matchAll(/(?<!\[)Quelle\s+(\d+)(?!\s*\])/g)) {
        addIfValid(parseInt(m[1], 10))
    }

    // 3. Ranges with en-dash/hyphen: Quelle 2–Quelle 5, [Quelle 2–5], Quelle 2-5
    for (const m of text.matchAll(/\[?Quelle\s+(\d+)\s*[–\-]\s*(?:Quelle\s+)?(\d+)\]?/g)) {
        const start = parseInt(m[1], 10)
        const end = parseInt(m[2], 10)
        for (let i = start; i <= end; i++) addIfValid(i)
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
