import { NextRequest } from 'next/server'
import { getEmbeddingModelById } from '@/src/data-access/embedding-models'
import { getAllChunks } from '@/src/data-access/source-texts'
import { getTestPhrases } from '@/src/data-access/test-phrases'
import { saveChunkEmbedding, savePhraseEmbedding } from '@/src/data-access/embeddings'
import { createEmbedding, type EmbeddingModelConfig } from '@/src/lib/embedding'

export async function GET(request: NextRequest) {
    const modelId = request.nextUrl.searchParams.get('modelId')
    if (!modelId) {
        return new Response('modelId parameter required', { status: 400 })
    }

    const model = await getEmbeddingModelById(modelId)
    if (!model) {
        return new Response('Modell nicht gefunden', { status: 404 })
    }

    const config: EmbeddingModelConfig = {
        name: model.name,
        provider: model.provider,
        providerUrl: model.providerUrl,
        dimensions: model.dimensions,
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }

            try {
                const chunks = await getAllChunks()
                const phrases = await getTestPhrases()
                const total = chunks.length + phrases.length
                let current = 0

                // Embed all chunks
                for (const chunk of chunks) {
                    try {
                        const embedding = await createEmbedding(chunk.content, config)
                        await saveChunkEmbedding(chunk.id, modelId, embedding)
                    } catch (err) {
                        send({ type: 'error', message: `Fehler bei Chunk ${chunk.chunkIndex}: ${err instanceof Error ? err.message : 'Unbekannt'}` })
                    }
                    current++
                    send({ type: 'progress', current, total, message: `Chunk ${current}/${chunks.length} eingebettet` })
                }

                // Embed all test phrases
                for (const phrase of phrases) {
                    try {
                        const embedding = await createEmbedding(phrase.phrase, config)
                        await savePhraseEmbedding(phrase.id, modelId, embedding)
                    } catch (err) {
                        send({ type: 'error', message: `Fehler bei Phrase "${phrase.phrase}": ${err instanceof Error ? err.message : 'Unbekannt'}` })
                    }
                    current++
                    send({ type: 'progress', current, total, message: `Phrase ${current - chunks.length}/${phrases.length} eingebettet` })
                }

                send({ type: 'complete', data: { chunksEmbedded: chunks.length, phrasesEmbedded: phrases.length } })
            } catch (err) {
                send({ type: 'error', message: err instanceof Error ? err.message : 'Unbekannter Fehler' })
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
