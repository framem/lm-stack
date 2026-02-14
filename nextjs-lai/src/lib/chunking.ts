import type { ParsedDocument } from '@/src/lib/document-parser'

export interface Chunk {
    content: string
    chunkIndex: number
    pageNumber: number | null
    tokenCount: number
}

// Approximate token count: ~4 characters per token on average
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
}

const TARGET_TOKENS = 300
const OVERLAP_TOKENS = 60
const TARGET_CHARS = TARGET_TOKENS * 4
const OVERLAP_CHARS = OVERLAP_TOKENS * 4

/**
 * Split text into overlapping chunks that respect sentence boundaries.
 * Each chunk targets ~300 tokens with ~60 token overlap (20%).
 */
export function chunkDocument(doc: ParsedDocument): Chunk[] {
    const { text, pageBreaks } = doc

    if (!text.trim()) {
        return []
    }

    // Split into sentences
    const sentences = splitSentences(text)
    if (sentences.length === 0) return []

    const chunks: Chunk[] = []
    let currentChars = 0
    let startIdx = 0

    for (let i = 0; i < sentences.length; i++) {
        currentChars += sentences[i].length

        // Check if we've reached the target chunk size
        if (currentChars >= TARGET_CHARS || i === sentences.length - 1) {
            const chunkText = sentences.slice(startIdx, i + 1).join(' ').trim()

            if (chunkText.length > 0) {
                // Determine page number from the character offset of the chunk start
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
            let overlapChars = 0
            let newStart = i + 1
            for (let j = i; j > startIdx; j--) {
                overlapChars += sentences[j].length
                if (overlapChars >= OVERLAP_CHARS) {
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
    // Split on sentence-ending punctuation followed by whitespace
    const raw = text.split(/(?<=[.!?])\s+/)
    return raw.map(s => s.trim()).filter(s => s.length > 0)
}

/**
 * Calculate character offset for a sentence at the given index.
 */
function getCharOffset(sentences: string[], index: number): number {
    let offset = 0
    for (let i = 0; i < index; i++) {
        offset += sentences[i].length + 1 // +1 for the space between sentences
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
