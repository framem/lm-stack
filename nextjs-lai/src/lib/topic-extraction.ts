import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { prisma } from '@/src/lib/prisma'

const MAX_CONTEXT_CHARS = 6000

const topicExtractionSchema = z.object({
    topics: z.array(
        z.object({
            name: z.string().describe('Short topic name, 2-5 words'),
            description: z.string().describe('Brief description of what this topic covers'),
            relatedChunkIndices: z.array(z.number()).describe('Indices of chunks that cover this topic'),
        })
    ),
})

// Extract topics from document chunks using LLM
export async function extractTopics(
    chunks: { id: string; content: string; chunkIndex: number }[]
): Promise<{ name: string; description: string; chunkIds: string[] }[]> {
    if (chunks.length === 0) return []

    // Build context from first 15 chunks, respecting char limit
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
        output: Output.object({ schema: topicExtractionSchema }),
        system: `Du extrahierst die Hauptthemen aus Lerntexten. Identifiziere 3-8 distinkte Themen, die im Text behandelt werden. Jedes Thema soll einen klar abgrenzbaren Wissensbereich darstellen.`,
        prompt: `Extrahiere die Hauptthemen aus dem folgenden Lerntext. Die Abschnittsnummern stehen in eckigen Klammern [Abschnitt N].\n\n${contextText}`,
    })

    if (!output?.topics) return []

    // Map chunk indices to chunk IDs
    return output.topics.map((topic) => ({
        name: topic.name,
        description: topic.description,
        chunkIds: topic.relatedChunkIndices
            .map((idx) => usedChunks.find((c) => c.chunkIndex === idx)?.id)
            .filter((id): id is string => !!id),
    }))
}

// Extract topics for a document and save to DB
export async function extractAndSaveTopics(documentId: string) {
    const chunks = await prisma.documentChunk.findMany({
        where: { documentId },
        orderBy: { chunkIndex: 'asc' },
        select: { id: true, content: true, chunkIndex: true },
    })

    if (chunks.length === 0) return []

    const topics = await extractTopics(chunks)
    if (topics.length === 0) return []

    // Delete existing topics for this document
    await prisma.topic.deleteMany({ where: { documentId } })

    // Create new topics
    const created = await Promise.all(
        topics.map((t) =>
            prisma.topic.create({
                data: {
                    documentId,
                    name: t.name,
                    description: t.description,
                    chunkIds: t.chunkIds,
                },
            })
        )
    )

    return created
}
