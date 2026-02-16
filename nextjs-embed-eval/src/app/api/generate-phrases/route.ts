import { NextRequest } from 'next/server'
import { getSourceTextWithChunks } from '@/src/data-access/source-texts'
import { createTestPhrase } from '@/src/data-access/test-phrases'
import { generatePhrasesForChunk, type LLMConfig } from '@/src/lib/llm'

export async function POST(request: NextRequest) {
    const body = await request.json()
    const {
        sourceTextId,
        chunkIds,
        modelName,
        provider,
        providerUrl,
        phrasesPerChunk = 3,
    } = body as {
        sourceTextId: string
        chunkIds?: string[]
        modelName: string
        provider: string
        providerUrl: string
        phrasesPerChunk?: number
    }

    if (!sourceTextId || !modelName || !provider || !providerUrl) {
        return new Response('Pflichtfelder fehlen: sourceTextId, modelName, provider, providerUrl', { status: 400 })
    }

    // Clamp phrasesPerChunk to sensible range
    const clampedPhrasesPerChunk = Math.max(1, Math.min(10, phrasesPerChunk))

    const sourceText = await getSourceTextWithChunks(sourceTextId)
    if (!sourceText) {
        return new Response('Quelltext nicht gefunden', { status: 404 })
    }

    // Filter chunks if specific IDs were requested
    const chunks = chunkIds
        ? sourceText.chunks.filter(c => chunkIds.includes(c.id))
        : sourceText.chunks

    if (chunks.length === 0) {
        return new Response('Keine Chunks gefunden', { status: 404 })
    }

    const llmConfig: LLMConfig = {
        provider: provider as 'lmstudio' | 'ollama',
        providerUrl,
        modelName,
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }

            let totalGenerated = 0

            try {
                for (let i = 0; i < chunks.length; i++) {
                    if (request.signal.aborted) {
                        send({ type: 'error', message: 'Abgebrochen' })
                        break
                    }

                    const chunk = chunks[i]
                    send({
                        type: 'progress',
                        current: i,
                        total: chunks.length,
                        message: `Chunk ${i + 1}/${chunks.length}: Phrasen werden generiert...`,
                    })

                    try {
                        const phrases = await generatePhrasesForChunk(
                            chunk.content,
                            sourceText.title,
                            llmConfig,
                            clampedPhrasesPerChunk
                        )

                        // Save each generated phrase to the database
                        for (const phrase of phrases) {
                            await createTestPhrase({
                                phrase: phrase.phrase,
                                category: phrase.category,
                                expectedChunkId: chunk.id,
                                sourceTextId: sourceText.id,
                                expectedContent: chunk.content,
                            })
                        }

                        totalGenerated += phrases.length

                        send({
                            type: 'progress',
                            current: i + 1,
                            total: chunks.length,
                            message: `Chunk ${i + 1}/${chunks.length}: ${phrases.length} Phrasen generiert`,
                        })
                    } catch (err) {
                        send({
                            type: 'error',
                            message: `Fehler bei Chunk ${i + 1}: ${err instanceof Error ? err.message : 'Unbekannt'}`,
                        })
                    }
                }

                send({
                    type: 'complete',
                    data: {
                        totalGenerated,
                        sourceTextId: sourceText.id,
                    },
                })
            } catch (err) {
                send({
                    type: 'error',
                    message: err instanceof Error ? err.message : 'Unbekannter Fehler',
                })
            } finally {
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    })
}
