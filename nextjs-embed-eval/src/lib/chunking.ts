export interface ChunkInput {
    text: string
    pageBreaks?: number[]
}

export interface ChunkConfig {
    targetTokens?: number
    overlapTokens?: number
    strategy?: ChunkStrategy
}

export type ChunkStrategy = 'sentence' | 'paragraph' | 'recursive' | 'semantic'

export interface Chunk {
    content: string
    chunkIndex: number
    pageNumber: number | null
    tokenCount: number
}

export const DEFAULT_TARGET_TOKENS = 300
export const DEFAULT_OVERLAP_TOKENS = 60

export const STRATEGY_LABELS: Record<ChunkStrategy, string> = {
    sentence: 'Satzgrenzen',
    paragraph: 'Absatzgrenzen',
    recursive: 'Rekursiv',
    semantic: 'Semantisch',
}

// Approximate token count: ~3.5 characters per token (tuned for German/English mix)
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.5)
}

/**
 * Split text into overlapping chunks using the specified strategy.
 */
export function chunkText(input: ChunkInput, config?: ChunkConfig): Chunk[] {
    const strategy = config?.strategy ?? 'sentence'

    switch (strategy) {
        case 'paragraph':
            return chunkByParagraph(input, config)
        case 'recursive':
            return chunkRecursive(input, config)
        case 'sentence':
        default:
            return chunkBySentence(input, config)
    }
}

// ---- Strategy: Sentence-boundary-aware ----

function chunkBySentence(input: ChunkInput, config?: ChunkConfig): Chunk[] {
    const { text, pageBreaks } = input
    const targetTokens = config?.targetTokens ?? DEFAULT_TARGET_TOKENS
    const overlapTokens = config?.overlapTokens ?? DEFAULT_OVERLAP_TOKENS
    const targetChars = targetTokens * 3.5
    const overlapChars = overlapTokens * 3.5

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

// ---- Strategy: Paragraph-based ----

function chunkByParagraph(input: ChunkInput, config?: ChunkConfig): Chunk[] {
    const { text, pageBreaks } = input
    const targetTokens = config?.targetTokens ?? DEFAULT_TARGET_TOKENS
    const overlapTokens = config?.overlapTokens ?? DEFAULT_OVERLAP_TOKENS
    const targetChars = targetTokens * 3.5
    const overlapChars = overlapTokens * 3.5

    if (!text.trim()) return []

    // Split by double newlines (paragraph boundaries)
    const paragraphs = text.split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0)

    if (paragraphs.length === 0) return []

    const chunks: Chunk[] = []
    let currentChars = 0
    let startIdx = 0

    for (let i = 0; i < paragraphs.length; i++) {
        currentChars += paragraphs[i].length

        if (currentChars >= targetChars || i === paragraphs.length - 1) {
            const chunkContent = paragraphs.slice(startIdx, i + 1).join('\n\n').trim()

            if (chunkContent.length > 0) {
                const chunkStartOffset = getParaOffset(paragraphs, startIdx)
                const pageNumber = getPageNumber(chunkStartOffset, pageBreaks)

                chunks.push({
                    content: chunkContent,
                    chunkIndex: chunks.length,
                    pageNumber,
                    tokenCount: estimateTokens(chunkContent),
                })
            }

            // Overlap: move back
            let overlapCount = 0
            let newStart = i + 1
            for (let j = i; j > startIdx; j--) {
                overlapCount += paragraphs[j].length
                if (overlapCount >= overlapChars) {
                    newStart = j
                    break
                }
            }

            startIdx = newStart
            currentChars = paragraphs.slice(startIdx, i + 1).reduce((sum, p) => sum + p.length, 0)
        }
    }

    return chunks
}

// ---- Strategy: Recursive character splitting ----

function chunkRecursive(input: ChunkInput, config?: ChunkConfig): Chunk[] {
    const { text, pageBreaks } = input
    const targetTokens = config?.targetTokens ?? DEFAULT_TARGET_TOKENS
    const overlapTokens = config?.overlapTokens ?? DEFAULT_OVERLAP_TOKENS
    const targetChars = targetTokens * 3.5
    const overlapChars = overlapTokens * 3.5

    if (!text.trim()) return []

    // Hierarchical separators: paragraphs → sentences → words
    const separators = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ']
    const segments = recursiveSplit(text, separators, targetChars)

    // Now merge small segments with overlap
    const chunks: Chunk[] = []
    let current = ''
    let overlapBuffer = ''

    for (const segment of segments) {
        if (current.length + segment.length > targetChars && current.length > 0) {
            const trimmed = current.trim()
            if (trimmed.length > 0) {
                const offset = text.indexOf(trimmed)
                chunks.push({
                    content: trimmed,
                    chunkIndex: chunks.length,
                    pageNumber: getPageNumber(offset >= 0 ? offset : 0, pageBreaks),
                    tokenCount: estimateTokens(trimmed),
                })
            }

            // Build overlap from end of current
            overlapBuffer = current.length > overlapChars
                ? current.slice(-overlapChars)
                : current
            current = overlapBuffer + segment
        } else {
            current += segment
        }
    }

    // Final chunk
    const trimmed = current.trim()
    if (trimmed.length > 0) {
        const offset = text.indexOf(trimmed)
        chunks.push({
            content: trimmed,
            chunkIndex: chunks.length,
            pageNumber: getPageNumber(offset >= 0 ? offset : 0, pageBreaks),
            tokenCount: estimateTokens(trimmed),
        })
    }

    return chunks
}

/**
 * Recursively split text using hierarchical separators.
 * Tries the first separator; if segments are still too large, uses the next.
 */
function recursiveSplit(text: string, separators: string[], maxChars: number): string[] {
    if (text.length <= maxChars || separators.length === 0) {
        return [text]
    }

    const [sep, ...rest] = separators
    const parts = text.split(sep)

    const result: string[] = []
    for (let i = 0; i < parts.length; i++) {
        const part = i < parts.length - 1 ? parts[i] + sep : parts[i]
        if (part.length > maxChars && rest.length > 0) {
            result.push(...recursiveSplit(part, rest, maxChars))
        } else {
            result.push(part)
        }
    }

    return result
}

// ---- Sentence splitting (improved) ----

/**
 * Split text into sentences, preserving meaningful boundaries.
 * Handles abbreviations (z.B., d.h., Dr., Nr., etc.), decimal numbers,
 * and other cases where a period doesn't end a sentence.
 */
export function splitSentences(text: string): string[] {
    // Common abbreviations that should not trigger a split
    const abbrevPattern = /(?:z\.B|d\.h|u\.a|o\.ä|v\.a|i\.d\.R|s\.o|s\.u|bzgl|bzw|ca|vgl|ggf|evtl|usw|etc|inkl|exkl|Nr|Dr|Prof|Mr|Mrs|Ms|St|Abs|Art|Bd|Kap|Fig|Abb|Tab|S|Aufl)$/i

    const raw: string[] = []
    let current = ''

    // Split on whitespace-following-punctuation, but check for abbreviations
    const parts = text.split(/(?<=[.!?])\s+/)

    for (let i = 0; i < parts.length; i++) {
        current += (current ? ' ' : '') + parts[i]

        // Check if the current segment ends with an abbreviation
        const endsWithAbbrev = abbrevPattern.test(current.replace(/[.!?]+$/, ''))
        // Check if it ends with a decimal number pattern (e.g. "3.")
        const endsWithDecimal = /\d\.$/.test(current)

        if (endsWithAbbrev || endsWithDecimal) {
            // Don't split — accumulate with next part
            continue
        }

        const trimmed = current.trim()
        if (trimmed.length > 0) {
            raw.push(trimmed)
        }
        current = ''
    }

    // Push any remainder
    if (current.trim().length > 0) {
        raw.push(current.trim())
    }

    return raw
}

// ---- Helpers ----

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
 * Calculate character offset for a paragraph at the given index.
 */
function getParaOffset(paragraphs: string[], index: number): number {
    let offset = 0
    for (let i = 0; i < index; i++) {
        offset += paragraphs[i].length + 2 // +2 for \n\n
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
