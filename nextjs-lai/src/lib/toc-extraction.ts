import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { prisma } from '@/src/lib/prisma'
import { updateDocument } from '@/src/data-access/documents'

const MAX_CONTEXT_CHARS = 6000

export interface TocSection {
    title: string
    level: number // 1-3
    startChunkIndex: number
}

const tocSchema = z.object({
    sections: z.array(
        z.object({
            title: z.string().describe('Section/chapter title'),
            level: z.number().min(1).max(3).describe('Heading level: 1=chapter, 2=section, 3=subsection'),
            startChunkIndex: z.number().describe('Index of the chunk where this section begins'),
        })
    ),
})

// Heuristic heading detection patterns
const HEADING_PATTERNS = [
    /^\d+\.\s+\S/,              // "1. Title"
    /^\d+\.\d+\.?\s+\S/,       // "1.1 Title" or "1.1. Title"
    /^Kapitel\s+\d+/i,         // "Kapitel 1"
    /^#{1,3}\s+\S/,            // Markdown headers
    /^[A-ZÄÖÜ][A-ZÄÖÜ\s]{4,}$/, // ALL CAPS lines (min 5 chars)
]

function detectHeadingLevel(line: string): number {
    if (/^#{3}\s/.test(line) || /^\d+\.\d+\.\d+\.?\s/.test(line)) return 3
    if (/^#{2}\s/.test(line) || /^\d+\.\d+\.?\s/.test(line)) return 2
    return 1
}

// Try heuristic heading extraction from chunk texts
function extractHeuristic(
    chunks: { content: string; chunkIndex: number }[]
): TocSection[] | null {
    const sections: TocSection[] = []

    for (const chunk of chunks) {
        const lines = chunk.content.split('\n')
        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.length > 120) continue

            const isHeading = HEADING_PATTERNS.some((p) => p.test(trimmed))
            if (isHeading) {
                // Clean markdown hashes
                const title = trimmed.replace(/^#{1,3}\s+/, '').trim()
                sections.push({
                    title,
                    level: detectHeadingLevel(trimmed),
                    startChunkIndex: chunk.chunkIndex,
                })
            }
        }
    }

    // Only use heuristic if we found enough headings
    return sections.length >= 3 ? sections : null
}

// LLM-based TOC extraction fallback
async function extractWithLLM(
    chunks: { content: string; chunkIndex: number }[]
): Promise<TocSection[]> {
    let contextText = ''
    const usedChunks: typeof chunks = []

    for (const chunk of chunks.slice(0, 15)) {
        const entry = `[Abschnitt ${chunk.chunkIndex}]:\n${chunk.content}`
        if (contextText.length + entry.length > MAX_CONTEXT_CHARS) break
        contextText += (contextText ? '\n\n---\n\n' : '') + entry
        usedChunks.push(chunk)
    }

    if (usedChunks.length === 0) return []

    const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema: tocSchema }),
        system: `Du extrahierst die Kapitel- und Abschnittsstruktur (Inhaltsverzeichnis) aus Lerntexten. Identifiziere Überschriften, Kapitel und thematische Abschnitte. Gib die startChunkIndex-Werte als die Abschnittsnummern an, die in eckigen Klammern vor jedem Textblock stehen.`,
        prompt: `Extrahiere das Inhaltsverzeichnis aus dem folgenden Text. Jeder Textblock ist mit seiner Abschnittsnummer gekennzeichnet [Abschnitt N].\n\n${contextText}`,
    })

    return output?.sections ?? []
}

// Main extraction function: heuristic first, LLM fallback
export async function extractTableOfContents(
    chunks: { content: string; chunkIndex: number }[]
): Promise<TocSection[]> {
    if (chunks.length === 0) return []

    const heuristic = extractHeuristic(chunks)
    if (heuristic) return heuristic

    return extractWithLLM(chunks)
}

// Generate TOC and save to document
export async function generateAndSaveToc(documentId: string) {
    const chunks = await prisma.documentChunk.findMany({
        where: { documentId },
        orderBy: { chunkIndex: 'asc' },
        select: { content: true, chunkIndex: true },
    })

    if (chunks.length === 0) return null

    const sections = await extractTableOfContents(chunks)
    if (sections.length === 0) return null

    await updateDocument(documentId, { tableOfContents: sections as unknown as string })

    return sections
}
