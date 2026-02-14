import type { Citation } from '@/src/lib/rag'

// Format a single citation as a readable label
export function formatCitationLabel(citation: Citation): string {
    const pageInfo = citation.pageNumber != null ? `, S. ${citation.pageNumber}` : ''
    return `[Quelle: ${citation.documentTitle}${pageInfo}]`
}

// Format citations array for storage in ChatMessage.sources (JSON)
export function formatCitationsForStorage(citations: Citation[]): object[] {
    return citations.map((c) => ({
        index: c.index,
        documentId: c.documentId,
        documentTitle: c.documentTitle,
        pageNumber: c.pageNumber,
        chunkId: c.chunkId,
        snippet: c.snippet,
        content: c.content,
    }))
}
