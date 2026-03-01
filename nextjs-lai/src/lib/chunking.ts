import type { ParsedDocument } from '@/src/lib/document-parser'
import {
    type ChunkingStrategy,
    CHUNKING_PARAMS,
    CHARS_PER_TOKEN,
    KB_QUESTION_PATTERN,
    KB_SECTION_PATTERN,
    KB_MIN_QUESTION_MATCHES,
    EXAM_SOLUTION_PATTERN,
    EXAM_TASK_PATTERN,
    EXAM_SUBTASK_PATTERN,
    EXAM_MIN_SOLUTION_MATCHES,
} from '@/src/lib/rag-config'

// ── Public types ──

export { type ChunkingStrategy } from '@/src/lib/rag-config'

export interface Chunk {
    content: string
    chunkIndex: number
    pageNumber: number | null
    tokenCount: number
    /** Which strategy produced this chunk */
    chunkingStrategy: ChunkingStrategy
    /** Section heading (knowledgebase) e.g. "1.1.2 Art und Güte..." */
    sectionHeading?: string
    /** Question number (knowledgebase) e.g. "05" */
    questionNumber?: string
    /** The question text (knowledgebase) e.g. "Was beinhaltet ein Informationsmanagement?" */
    questionText?: string
    /** Exam context label e.g. "Musterprüfung 1 – Aufgabenstellung 1" */
    examLabel?: string
    /** Task number (exam) e.g. "4" */
    taskNumber?: string
    /** Sub-task label (exam) e.g. "c)" */
    subTask?: string
    /** Block type (exam) */
    blockType?: 'aufgabe' | 'loesung'
}

// ── Token estimation ──

export function estimateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN)
}

// ── Strategy auto-detection ──

export function detectStrategy(text: string): ChunkingStrategy {
    // Check exam first (more specific pattern)
    const examMatches = text.match(new RegExp(EXAM_SOLUTION_PATTERN.source, 'gm'))
    if (examMatches && examMatches.length >= EXAM_MIN_SOLUTION_MATCHES) {
        return 'exam'
    }

    // Check knowledgebase (numbered questions)
    const kbMatches = text.match(new RegExp(KB_QUESTION_PATTERN.source, 'gm'))
    if (kbMatches && kbMatches.length >= KB_MIN_QUESTION_MATCHES) {
        return 'knowledgebase'
    }

    return 'sentence'
}

// ── Main entry point ──

/**
 * Chunk a parsed document using auto-detected or specified strategy.
 */
export function chunkDocument(
    doc: ParsedDocument,
    strategyOverride?: ChunkingStrategy,
): Chunk[] {
    const { text, pageBreaks } = doc
    if (!text.trim()) return []

    const strategy = strategyOverride ?? detectStrategy(text)

    switch (strategy) {
        case 'knowledgebase':
            return chunkKnowledgebase(text, pageBreaks)
        case 'exam':
            return chunkExam(text, pageBreaks)
        case 'sentence':
        default:
            return chunkSentence(text, pageBreaks)
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Strategy 1: Knowledgebase (Frage-Antwort-Lehrbuch)
// ═══════════════════════════════════════════════════════════════════════════════

function chunkKnowledgebase(text: string, pageBreaks?: number[]): Chunk[] {
    const params = CHUNKING_PARAMS.knowledgebase
    const chunks: Chunk[] = []

    // ── Ebene 1: Find section headings ──
    const sectionRegex = /^(\d+\.\d+(?:\.\d+)*)\s+(.+)/gm
    const sectionPositions: { index: number; heading: string; label: string }[] = []
    let m: RegExpExecArray | null
    while ((m = sectionRegex.exec(text)) !== null) {
        sectionPositions.push({
            index: m.index,
            label: m[1],
            heading: `${m[1]} ${m[2].trim()}`,
        })
    }

    // ── Ebene 2: Split at numbered questions (NN. ) ──
    const questionSplitRegex = /^(\d{2,3})\.\s+/gm
    const questionPositions: { index: number; number: string }[] = []
    while ((m = questionSplitRegex.exec(text)) !== null) {
        questionPositions.push({ index: m.index, number: m[1] })
    }

    if (questionPositions.length === 0) {
        return chunkSentence(text, pageBreaks)
    }

    // Capture intro text before first question
    if (questionPositions[0].index > 100) {
        const introText = text.slice(0, questionPositions[0].index).trim()
        if (introText && estimateTokens(introText) >= params.minChunkSizeTokens) {
            const introChunks = splitWithOverlap(introText, CHUNKING_PARAMS.sentence)
            for (const sub of introChunks) {
                chunks.push({
                    content: sub.text,
                    chunkIndex: chunks.length,
                    pageNumber: getPageNumber(sub.offset, pageBreaks),
                    tokenCount: estimateTokens(sub.text),
                    chunkingStrategy: 'knowledgebase',
                })
            }
        }
    }

    // Build Q&A blocks: each from one question start to the next
    for (let qi = 0; qi < questionPositions.length; qi++) {
        const qStart = questionPositions[qi].index
        const qEnd = qi + 1 < questionPositions.length
            ? questionPositions[qi + 1].index
            : findNextSectionOrEnd(text, qStart, sectionPositions)

        const blockText = text.slice(qStart, qEnd).trim()
        if (!blockText) continue

        const qNumber = questionPositions[qi].number

        // Extract question text (first line after "NN. ")
        const firstLineEnd = blockText.indexOf('\n')
        const questionLine = firstLineEnd > 0 ? blockText.slice(0, firstLineEnd).trim() : blockText.trim()
        const qTextMatch = questionLine.match(/^\d{2,3}\.\s+(.+)/)
        const questionText = qTextMatch ? qTextMatch[1] : questionLine

        // Find which section this question belongs to
        const sectionHeading = findCurrentSection(qStart, sectionPositions)

        const blockTokens = estimateTokens(blockText)

        if (blockTokens <= params.maxChunkSizeTokens) {
            // Block fits — emit as single chunk
            chunks.push({
                content: blockText,
                chunkIndex: chunks.length,
                pageNumber: getPageNumber(qStart, pageBreaks),
                tokenCount: blockTokens,
                chunkingStrategy: 'knowledgebase',
                sectionHeading,
                questionNumber: qNumber,
                questionText,
            })
        } else {
            // ── Ebene 3: Overflow split at sentence boundaries ──
            const subChunks = splitWithOverlap(blockText, params)
            for (const sub of subChunks) {
                chunks.push({
                    content: sub.text,
                    chunkIndex: chunks.length,
                    pageNumber: getPageNumber(qStart + sub.offset, pageBreaks),
                    tokenCount: estimateTokens(sub.text),
                    chunkingStrategy: 'knowledgebase',
                    sectionHeading,
                    questionNumber: qNumber,
                    questionText,
                })
            }
        }
    }

    // Reindex all chunks sequentially
    chunks.forEach((c, i) => { c.chunkIndex = i })

    return chunks
}

/** Find the end boundary: next section heading or end of text */
function findNextSectionOrEnd(
    text: string,
    currentPos: number,
    sections: { index: number }[],
): number {
    for (const s of sections) {
        if (s.index > currentPos + 10) return s.index
    }
    return text.length
}

/** Find which section heading applies to the given offset */
function findCurrentSection(
    offset: number,
    sections: { index: number; heading: string }[],
): string | undefined {
    let current: string | undefined
    for (const s of sections) {
        if (s.index <= offset) current = s.heading
        else break
    }
    return current
}

// ═══════════════════════════════════════════════════════════════════════════════
// Strategy 2: Exam (Prüfungsaufgaben + Lösungen)
// ═══════════════════════════════════════════════════════════════════════════════

function chunkExam(text: string, pageBreaks?: number[]): Chunk[] {
    const params = CHUNKING_PARAMS.exam
    const chunks: Chunk[] = []

    // ── Ebene 1: Split at "Aufgabe N:" and "Lösung zu Aufgabe N:" ──
    const blockRegex = /^(Lösung zu Aufgabe\s+(\d+):|Aufgabe\s+(\d+):)/gm
    const blockPositions: { index: number; blockType: 'aufgabe' | 'loesung'; taskNumber: string; label: string }[] = []
    let m: RegExpExecArray | null
    while ((m = blockRegex.exec(text)) !== null) {
        const isLoesung = m[1].startsWith('Lösung')
        blockPositions.push({
            index: m.index,
            blockType: isLoesung ? 'loesung' : 'aufgabe',
            taskNumber: isLoesung ? m[2] : m[3],
            label: m[1],
        })
    }

    if (blockPositions.length === 0) {
        return chunkSentence(text, pageBreaks)
    }

    // Detect exam label context
    const examContextMap = buildExamContextMap(text)

    // Capture intro text
    if (blockPositions[0].index > 200) {
        const introText = text.slice(0, blockPositions[0].index).trim()
        if (introText && estimateTokens(introText) >= CHUNKING_PARAMS.sentence.minChunkSizeTokens) {
            const introChunks = splitWithOverlap(introText, CHUNKING_PARAMS.sentence)
            for (const sub of introChunks) {
                chunks.push({
                    content: sub.text,
                    chunkIndex: chunks.length,
                    pageNumber: getPageNumber(sub.offset, pageBreaks),
                    tokenCount: estimateTokens(sub.text),
                    chunkingStrategy: 'exam',
                })
            }
        }
    }

    // Process each block
    for (let bi = 0; bi < blockPositions.length; bi++) {
        const bStart = blockPositions[bi].index
        const bEnd = bi + 1 < blockPositions.length
            ? blockPositions[bi + 1].index
            : text.length

        const blockText = text.slice(bStart, bEnd).trim()
        if (!blockText) continue

        const { blockType, taskNumber, label } = blockPositions[bi]
        const examLabel = findExamLabel(bStart, examContextMap)

        // ── Ebene 2: Split at sub-tasks a)-e) ──
        const subTaskRegex = /^([a-e])\)\s/gm
        const subTaskPositions: { index: number; label: string }[] = []
        let sm: RegExpExecArray | null
        while ((sm = subTaskRegex.exec(blockText)) !== null) {
            subTaskPositions.push({ index: sm.index, label: `${sm[1]})` })
        }

        if (subTaskPositions.length > 0) {
            // Emit prefix before first sub-task if substantial
            const prefixText = blockText.slice(0, subTaskPositions[0].index).trim()
            if (prefixText && estimateTokens(prefixText) >= params.minChunkSizeTokens) {
                chunks.push({
                    content: prefixText,
                    chunkIndex: chunks.length,
                    pageNumber: getPageNumber(bStart, pageBreaks),
                    tokenCount: estimateTokens(prefixText),
                    chunkingStrategy: 'exam',
                    examLabel,
                    taskNumber,
                    blockType,
                })
            }

            // Collect raw subtask slices first, then merge tiny ones
            interface SubtaskSlice { content: string; label: string; offset: number }
            const rawSlices: SubtaskSlice[] = []

            for (let si = 0; si < subTaskPositions.length; si++) {
                const stStart = subTaskPositions[si].index
                const stEnd = si + 1 < subTaskPositions.length
                    ? subTaskPositions[si + 1].index
                    : blockText.length

                let subTaskContent = blockText.slice(stStart, stEnd).trim()
                if (!subTaskContent) continue

                // Prefix with block label for context
                subTaskContent = `${label}\n${subTaskContent}`
                rawSlices.push({ content: subTaskContent, label: subTaskPositions[si].label, offset: stStart })
            }

            // Merge subtasks that are below minChunkSizeTokens into their successor
            const mergedSlices: SubtaskSlice[] = []
            for (const slice of rawSlices) {
                if (
                    mergedSlices.length > 0 &&
                    estimateTokens(mergedSlices[mergedSlices.length - 1].content) < params.minChunkSizeTokens
                ) {
                    // Previous slice is too small — absorb current into it
                    const prev = mergedSlices[mergedSlices.length - 1]
                    prev.content += '\n' + slice.content
                    prev.label += '+' + slice.label
                } else {
                    mergedSlices.push({ ...slice })
                }
            }
            // If last merged slice is still tiny, fold it backward
            if (
                mergedSlices.length > 1 &&
                estimateTokens(mergedSlices[mergedSlices.length - 1].content) < params.minChunkSizeTokens
            ) {
                const tiny = mergedSlices.pop()!
                mergedSlices[mergedSlices.length - 1].content += '\n' + tiny.content
                mergedSlices[mergedSlices.length - 1].label += '+' + tiny.label
            }

            // Emit merged subtask chunks
            for (const s of mergedSlices) {
                const subTokens = estimateTokens(s.content)

                if (subTokens <= params.maxChunkSizeTokens) {
                    chunks.push({
                        content: s.content,
                        chunkIndex: chunks.length,
                        pageNumber: getPageNumber(bStart + s.offset, pageBreaks),
                        tokenCount: subTokens,
                        chunkingStrategy: 'exam',
                        examLabel,
                        taskNumber,
                        subTask: s.label,
                        blockType,
                    })
                } else {
                    // Ebene 3: overflow split
                    const subs = splitWithOverlap(s.content, params)
                    for (const sub of subs) {
                        chunks.push({
                            content: sub.text,
                            chunkIndex: chunks.length,
                            pageNumber: getPageNumber(bStart + s.offset + sub.offset, pageBreaks),
                            tokenCount: estimateTokens(sub.text),
                            chunkingStrategy: 'exam',
                            examLabel,
                            taskNumber,
                            subTask: s.label,
                            blockType,
                        })
                    }
                }
            }
        } else {
            // No sub-tasks — emit block as-is or split if too large
            const blockTokens = estimateTokens(blockText)
            if (blockTokens <= params.maxChunkSizeTokens) {
                if (blockTokens >= params.minChunkSizeTokens) {
                    chunks.push({
                        content: blockText,
                        chunkIndex: chunks.length,
                        pageNumber: getPageNumber(bStart, pageBreaks),
                        tokenCount: blockTokens,
                        chunkingStrategy: 'exam',
                        examLabel,
                        taskNumber,
                        blockType,
                    })
                }
            } else {
                const subs = splitWithOverlap(blockText, params)
                for (const sub of subs) {
                    chunks.push({
                        content: sub.text,
                        chunkIndex: chunks.length,
                        pageNumber: getPageNumber(bStart + sub.offset, pageBreaks),
                        tokenCount: estimateTokens(sub.text),
                        chunkingStrategy: 'exam',
                        examLabel,
                        taskNumber,
                        blockType,
                    })
                }
            }
        }
    }

    // Reindex
    chunks.forEach((c, i) => { c.chunkIndex = i })
    return chunks
}

/** Build a map of text-offsets → "Musterprüfung N – Aufgabenstellung N" labels */
function buildExamContextMap(text: string): { index: number; label: string }[] {
    const entries: { index: number; label: string }[] = []

    const mpAll: { index: number; label: string }[] = []
    const mpRegex = /Musterprüfung\s+(\d+)/g
    let m: RegExpExecArray | null
    while ((m = mpRegex.exec(text)) !== null) {
        mpAll.push({ index: m.index, label: `Musterprüfung ${m[1]}` })
    }

    const asRegex = /^Aufgabenstellung\s+(\d+)/gm
    const asAll: { index: number; num: string }[] = []
    while ((m = asRegex.exec(text)) !== null) {
        asAll.push({ index: m.index, num: m[1] })
    }

    for (const as_ of asAll) {
        const exam = mpAll.filter(mp => mp.index <= as_.index).pop()
        const label = exam ? `${exam.label} – Aufgabenstellung ${as_.num}` : `Aufgabenstellung ${as_.num}`
        entries.push({ index: as_.index, label })
    }

    return entries
}

/** Find the exam label for a given offset */
function findExamLabel(offset: number, contextMap: { index: number; label: string }[]): string | undefined {
    let current: string | undefined
    for (const entry of contextMap) {
        if (entry.index <= offset) current = entry.label
        else break
    }
    return current
}

// ═══════════════════════════════════════════════════════════════════════════════
// Strategy 3: Sentence-based (Fallback)
// ═══════════════════════════════════════════════════════════════════════════════

function chunkSentence(text: string, pageBreaks?: number[]): Chunk[] {
    const subChunks = splitWithOverlap(text, CHUNKING_PARAMS.sentence)
    return subChunks.map((sub, i) => ({
        content: sub.text,
        chunkIndex: i,
        pageNumber: getPageNumber(sub.offset, pageBreaks),
        tokenCount: estimateTokens(sub.text),
        chunkingStrategy: 'sentence' as const,
    }))
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared helpers
// ═══════════════════════════════════════════════════════════════════════════════

interface SubChunk {
    text: string
    /** Character offset within the parent block */
    offset: number
}

/**
 * Split a block of text at sentence boundaries with overlap.
 * Used by all strategies for overflow handling.
 *
 * Enforces both a soft *target* (preferred split point) and a hard *max*
 * (never exceeded unless a single sentence is already over the limit).
 */
function splitWithOverlap(
    blockText: string,
    params: { targetChunkSizeTokens: number; maxChunkSizeTokens?: number; overlapTokens: number },
): SubChunk[] {
    const targetChars = params.targetChunkSizeTokens * CHARS_PER_TOKEN
    const maxChars = params.maxChunkSizeTokens
        ? params.maxChunkSizeTokens * CHARS_PER_TOKEN
        : Math.ceil(targetChars * 1.3)
    const overlapChars = params.overlapTokens * CHARS_PER_TOKEN

    // Split into sentences, then break any single sentence that exceeds maxChars
    const sentences = splitSentences(blockText).flatMap(
        s => s.length > maxChars ? splitAtWordBoundaries(s, maxChars) : [s],
    )
    if (sentences.length === 0) return [{ text: blockText, offset: 0 }]

    const subChunks: SubChunk[] = []
    let currentChars = 0
    let startIdx = 0

    for (let i = 0; i < sentences.length; i++) {
        const wouldBe = currentChars + sentences[i].length

        // ── Hard ceiling: emit *before* this sentence if it would exceed max ──
        if (currentChars > 0 && wouldBe > maxChars) {
            const chunkText = sentences.slice(startIdx, i).join(' ').trim()
            if (chunkText.length > 0) {
                subChunks.push({ text: chunkText, offset: getCharOffset(sentences, startIdx) })
            }
            let newStart = i
            let overlapCount = 0
            for (let j = i - 1; j >= startIdx; j--) {
                overlapCount += sentences[j].length
                if (overlapCount >= overlapChars) { newStart = j; break }
            }
            // If overlap + current sentence would still exceed maxChars, drop the overlap
            const overlapLen = sentences.slice(newStart, i).reduce((s, v) => s + v.length, 0)
            if (overlapLen + sentences[i].length > maxChars) {
                newStart = i
            }
            startIdx = newStart
            currentChars = sentences.slice(startIdx, i).reduce((s, v) => s + v.length, 0)
        }

        currentChars += sentences[i].length

        // ── Soft target reached or last sentence ──
        if (currentChars >= targetChars || i === sentences.length - 1) {
            const chunkText = sentences.slice(startIdx, i + 1).join(' ').trim()
            if (chunkText.length > 0) {
                subChunks.push({ text: chunkText, offset: getCharOffset(sentences, startIdx) })
            }
            let overlapCount = 0
            let newStart = i + 1
            for (let j = i; j > startIdx; j--) {
                overlapCount += sentences[j].length
                if (overlapCount >= overlapChars) { newStart = j; break }
            }
            startIdx = newStart
            currentChars = sentences.slice(startIdx, i + 1).reduce((sum, s) => sum + s.length, 0)
        }
    }

    return subChunks
}

/** Split a long text at word boundaries so each piece is at most maxChars. */
function splitAtWordBoundaries(text: string, maxChars: number): string[] {
    const words = text.split(/\s+/)
    const pieces: string[] = []
    let current = ''
    for (const w of words) {
        if (current && current.length + 1 + w.length > maxChars) {
            pieces.push(current)
            current = w
        } else {
            current = current ? `${current} ${w}` : w
        }
    }
    if (current) pieces.push(current)
    return pieces.length > 0 ? pieces : [text]
}

/** Split text into sentences, preserving meaningful boundaries. */
function splitSentences(text: string): string[] {
    const raw = text.split(/(?<=[.!?])\s+/)
    return raw.map(s => s.trim()).filter(s => s.length > 0)
}

/** Calculate character offset for a sentence at the given index. */
function getCharOffset(sentences: string[], index: number): number {
    let offset = 0
    for (let i = 0; i < index; i++) {
        offset += sentences[i].length + 1
    }
    return offset
}

/** Determine which page a character offset falls on. */
function getPageNumber(offset: number, pageBreaks?: number[]): number | null {
    if (!pageBreaks || pageBreaks.length === 0) return null
    for (let i = 0; i < pageBreaks.length; i++) {
        if (offset < pageBreaks[i]) return i + 1
    }
    return pageBreaks.length
}
