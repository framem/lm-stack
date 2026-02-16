import { NextRequest } from 'next/server'
import { getEmbeddingModels, updateModelEmbedDuration } from '@/src/data-access/embedding-models'
import { getAllChunks } from '@/src/data-access/source-texts'
import { getTestPhrases } from '@/src/data-access/test-phrases'
import { saveChunkEmbeddingsBatch, savePhraseEmbeddingsBatch } from '@/src/data-access/embeddings'
import { createEmbeddings, type EmbeddingModelConfig } from '@/src/lib/embedding'

const BATCH_SIZE = 50

export async function GET(request: NextRequest) {
    const models = await getEmbeddingModels()
    if (models.length === 0) {
        return new Response('Keine Modelle registriert', { status: 400 })
    }

    const chunks = await getAllChunks()
    const phrases = await getTestPhrases()
    const itemsPerModel = chunks.length + phrases.length
    const totalItems = itemsPerModel * models.length

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }

            if (itemsPerModel === 0) {
                send({ type: 'complete', data: { modelsProcessed: 0, chunksEmbedded: 0, phrasesEmbedded: 0, totalDurationMs: 0 } })
                controller.close()
                return
            }

            let globalCurrent = 0
            const globalStart = Date.now()
            let totalChunksEmbedded = 0
            let totalPhrasesEmbedded = 0

            try {
                for (let mi = 0; mi < models.length; mi++) {
                    // Check if client disconnected
                    if (request.signal.aborted) break

                    const model = models[mi]
                    const phase = `Modell ${mi + 1}/${models.length}: ${model.name}`

                    const config: EmbeddingModelConfig = {
                        name: model.name,
                        provider: model.provider,
                        providerUrl: model.providerUrl,
                        dimensions: model.dimensions,
                        queryPrefix: model.queryPrefix,
                        documentPrefix: model.documentPrefix,
                    }

                    const modelStart = Date.now()

                    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                        // Check if client disconnected
                        if (request.signal.aborted) {
                            send({ type: 'error', message: 'Abgebrochen' })
                            break
                        }
                        const batch = chunks.slice(i, i + BATCH_SIZE)
                        try {
                            const embeddings = await createEmbeddings(batch.map(c => c.content), config, 'document')
                            await saveChunkEmbeddingsBatch(
                                batch.map((chunk, idx) => ({ chunkId: chunk.id, embedding: embeddings[idx] })),
                                model.id
                            )
                            totalChunksEmbedded += batch.length
                        } catch (err) {
                            send({ type: 'error', message: `[${model.name}] Fehler bei Chunk-Batch ${i + 1}-${i + batch.length}: ${err instanceof Error ? err.message : 'Unbekannt'}` })
                        }
                        globalCurrent += batch.length
                        send({
                            type: 'progress',
                            current: globalCurrent,
                            total: totalItems,
                            phase,
                            message: `Chunk ${Math.min(i + batch.length, chunks.length)}/${chunks.length}`,
                            elapsedMs: Date.now() - globalStart,
                        })
                    }

                    for (let i = 0; i < phrases.length; i += BATCH_SIZE) {
                        // Check if client disconnected
                        if (request.signal.aborted) {
                            send({ type: 'error', message: 'Abgebrochen' })
                            break
                        }
                        const batch = phrases.slice(i, i + BATCH_SIZE)
                        try {
                            const embeddings = await createEmbeddings(batch.map(p => p.phrase), config, 'query')
                            await savePhraseEmbeddingsBatch(
                                batch.map((phrase, idx) => ({ phraseId: phrase.id, embedding: embeddings[idx] })),
                                model.id
                            )
                            totalPhrasesEmbedded += batch.length
                        } catch (err) {
                            send({ type: 'error', message: `[${model.name}] Fehler bei Phrasen-Batch ${i + 1}-${i + batch.length}: ${err instanceof Error ? err.message : 'Unbekannt'}` })
                        }
                        globalCurrent += batch.length
                        send({
                            type: 'progress',
                            current: globalCurrent,
                            total: totalItems,
                            phase,
                            message: `Phrase ${Math.min(i + batch.length, phrases.length)}/${phrases.length}`,
                            elapsedMs: Date.now() - globalStart,
                        })
                    }

                    await updateModelEmbedDuration(model.id, Date.now() - modelStart)
                }

                send({
                    type: 'complete',
                    data: {
                        modelsProcessed: models.length,
                        chunksEmbedded: totalChunksEmbedded,
                        phrasesEmbedded: totalPhrasesEmbedded,
                        totalDurationMs: Date.now() - globalStart,
                    },
                })
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
