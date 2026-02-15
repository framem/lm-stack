export interface ChunkInput {
    text: string
    pageBreaks?: number[]
}

export interface ChunkConfig {
    targetTokens?: number
    overlapTokens?: number
}

export interface Chunk {
    content: string
    chunkIndex: number
    pageNumber: number | null
    tokenCount: number
}

export const DEFAULT_TARGET_TOKENS = 300
export const DEFAULT_OVERLAP_TOKENS = 60

// Approximate token count: ~4 characters per token on average
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
}

/**
 * Split text into overlapping chunks that respect sentence boundaries.
 */
export function chunkText(input: ChunkInput, config?: ChunkConfig): Chunk[] {
    const { text, pageBreaks } = input
    const targetTokens = config?.targetTokens ?? DEFAULT_TARGET_TOKENS
    const overlapTokens = config?.overlapTokens ?? DEFAULT_OVERLAP_TOKENS
    const targetChars = targetTokens * 4
    const overlapChars = overlapTokens * 4

    if (!text.trim()) {
        return []
    }

    const sentences = splitSentences(text)
    if (sentences.length === 0) return []

    const chunks: Chunk[] = []
    let currentChars = 0
    let startIdx = 0

    for (let i = 0; i < sentences.length; i++) {
        currentChars += sentences[i].length

        if (currentChars >= targetChars || i === sentences.length - 1) {
            const chunkText = sentences.slice(startIdx, i + 1).join(' ').trim()

            if (chunkText.length > 0) {
                const chunkStartOffset = getCharOffset(sentences, startIdx)
                const pageNumber = getPageNumber(chunkStartOffset, pageBreaks)

                chunks.push({
                    content: chunkText,
                    chunkIndex: chunks.length,
                    pageNumber,
                    tokenCount: estimateTokens(chunkText),
                })
            }

            // Move start index back to create overlap
            let overlapCount = 0
            let newStart = i + 1
            for (let j = i; j > startIdx; j--) {
                overlapCount += sentences[j].length
                if (overlapCount >= overlapChars) {
                    newStart = j
                    break
                }
            }

            startIdx = newStart
            currentChars = sentences.slice(startIdx, i + 1).reduce((sum, s) => sum + s.length, 0)
        }
    }

    return chunks
}

/**
 * Split text into sentences, preserving meaningful boundaries.
 */
function splitSentences(text: string): string[] {
    const raw = text.split(/(?<=[.!?])\s+/)
    return raw.map(s => s.trim()).filter(s => s.length > 0)
}

/**
 * Calculate character offset for a sentence at the given index.
 */
function getCharOffset(sentences: string[], index: number): number {
    let offset = 0
    for (let i = 0; i < index; i++) {
        offset += sentences[i].length + 1
    }
    return offset
}

/**
 * Determine which page a character offset falls on.
 */
function getPageNumber(offset: number, pageBreaks?: number[]): number | null {
    if (!pageBreaks || pageBreaks.length === 0) return null
    for (let i = 0; i < pageBreaks.length; i++) {
        if (offset < pageBreaks[i]) return i + 1
    }
    return pageBreaks.length
}
