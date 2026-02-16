import { splitSentences, type ChunkInput, type Chunk, DEFAULT_TARGET_TOKENS, DEFAULT_OVERLAP_TOKENS } from './chunking'
import { createEmbeddings, type EmbeddingModelConfig } from './embedding'
import { cosineSimilarity } from './similarity'

export interface SemanticChunkConfig {
    targetTokens?: number
    overlapTokens?: number
    embeddingConfig: EmbeddingModelConfig
    similarityThreshold?: number  // default 0.5 — split when cosine sim drops below this
    windowSize?: number           // default 3 — sentences per embedding window
}

// Approximate token count: ~3.5 characters per token (matches chunking.ts)
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.5)
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

/**
 * Build sliding windows of `windowSize` sentences, joined as single strings.
 */
function buildWindows(sentences: string[], windowSize: number): string[] {
    const windows: string[] = []
    for (let i = 0; i <= sentences.length - windowSize; i++) {
        windows.push(sentences.slice(i, i + windowSize).join(' '))
    }
    // If fewer sentences than windowSize, create a single window from all
    if (windows.length === 0 && sentences.length > 0) {
        windows.push(sentences.join(' '))
    }
    return windows
}

/**
 * Semantic chunking: uses embedding similarity between sliding sentence windows
 * to find natural topic boundaries.
 *
 * Algorithm:
 * 1. Split text into sentences
 * 2. Build sliding windows of `windowSize` sentences
 * 3. Embed each window
 * 4. Compute cosine similarity between consecutive windows
 * 5. Place breakpoints where similarity drops below threshold
 * 6. Merge sentences between breakpoints into chunks
 * 7. Split oversized chunks using sentence strategy
 * 8. Apply overlap
 */
export async function chunkTextSemantic(
    input: ChunkInput,
    config: SemanticChunkConfig
): Promise<Chunk[]> {
    const { text, pageBreaks } = input
    const targetTokens = config.targetTokens ?? DEFAULT_TARGET_TOKENS
    const overlapTokens = config.overlapTokens ?? DEFAULT_OVERLAP_TOKENS
    const threshold = config.similarityThreshold ?? 0.5
    const windowSize = config.windowSize ?? 3

    if (!text.trim()) return []

    const sentences = splitSentences(text)
    if (sentences.length === 0) return []

    // For very short texts, return a single chunk
    if (sentences.length <= windowSize) {
        const content = sentences.join(' ').trim()
        return [{
            content,
            chunkIndex: 0,
            pageNumber: getPageNumber(0, pageBreaks),
            tokenCount: estimateTokens(content),
        }]
    }

    // Step 1-2: Build sliding windows
    const windows = buildWindows(sentences, windowSize)

    // Step 3: Embed all windows in batch
    const EMBED_BATCH_SIZE = 50
    const windowEmbeddings: number[][] = []
    for (let i = 0; i < windows.length; i += EMBED_BATCH_SIZE) {
        const batch = windows.slice(i, i + EMBED_BATCH_SIZE)
        const embeddings = await createEmbeddings(batch, config.embeddingConfig, 'document')
        windowEmbeddings.push(...embeddings)
    }

    // Step 4: Compute similarities between consecutive windows
    const similarities: number[] = []
    for (let i = 0; i < windowEmbeddings.length - 1; i++) {
        similarities.push(cosineSimilarity(windowEmbeddings[i], windowEmbeddings[i + 1]))
    }

    // Step 5: Find breakpoints where similarity drops below threshold
    // Each similarity[i] corresponds to the boundary between sentence[i + windowSize - 1]
    // and sentence[i + windowSize], since window[i] covers sentences[i..i+windowSize-1]
    // and window[i+1] covers sentences[i+1..i+windowSize].
    // The "center" of the gap is at sentence index (i + windowSize).
    const breakSentenceIndices: number[] = []
    for (let i = 0; i < similarities.length; i++) {
        if (similarities[i] < threshold) {
            // Break after sentence at index (i + windowSize - 1)
            // which means the next chunk starts at sentence (i + windowSize)
            const breakAfter = i + Math.floor(windowSize / 2)
            // Avoid duplicate or too-close breakpoints
            if (breakSentenceIndices.length === 0 ||
                breakAfter - breakSentenceIndices[breakSentenceIndices.length - 1] >= 2) {
                breakSentenceIndices.push(breakAfter)
            }
        }
    }

    // Step 6: Build raw chunks from sentence groups between breakpoints
    const rawChunks: string[] = []
    let start = 0
    for (const breakIdx of breakSentenceIndices) {
        const end = Math.min(breakIdx + 1, sentences.length)
        if (end > start) {
            rawChunks.push(sentences.slice(start, end).join(' ').trim())
            start = end
        }
    }
    // Remaining sentences
    if (start < sentences.length) {
        rawChunks.push(sentences.slice(start).join(' ').trim())
    }

    // Step 7: Split oversized chunks (> targetTokens * 2)
    const maxTokens = targetTokens * 2
    const splitChunks: string[] = []
    for (const chunk of rawChunks) {
        if (estimateTokens(chunk) > maxTokens) {
            // Split by sentences within this chunk
            const subSentences = splitSentences(chunk)
            let current = ''
            for (const sent of subSentences) {
                if (estimateTokens(current + ' ' + sent) > targetTokens && current.length > 0) {
                    splitChunks.push(current.trim())
                    current = sent
                } else {
                    current += (current ? ' ' : '') + sent
                }
            }
            if (current.trim()) splitChunks.push(current.trim())
        } else {
            splitChunks.push(chunk)
        }
    }

    // Step 8: Apply overlap and build final Chunk[]
    const overlapChars = overlapTokens * 3.5
    const chunks: Chunk[] = []
    let previousContent = ''

    for (let i = 0; i < splitChunks.length; i++) {
        let content = splitChunks[i]
        if (content.length === 0) continue

        // Add overlap from previous chunk
        if (i > 0 && previousContent.length > 0 && overlapChars > 0) {
            const overlapText = previousContent.length > overlapChars
                ? previousContent.slice(-overlapChars)
                : previousContent
            // Find a sentence boundary in the overlap to avoid cutting mid-sentence
            const lastSentenceEnd = overlapText.lastIndexOf('. ')
            const cleanOverlap = lastSentenceEnd > 0
                ? overlapText.slice(lastSentenceEnd + 2)
                : overlapText
            if (cleanOverlap.trim()) {
                content = cleanOverlap.trim() + ' ' + content
            }
        }

        const offset = text.indexOf(splitChunks[i].slice(0, 50))
        chunks.push({
            content: content.trim(),
            chunkIndex: chunks.length,
            pageNumber: getPageNumber(offset >= 0 ? offset : 0, pageBreaks),
            tokenCount: estimateTokens(content),
        })

        previousContent = splitChunks[i]
    }

    return chunks
}
