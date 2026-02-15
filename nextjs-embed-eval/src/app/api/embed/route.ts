import { NextRequest } from 'next/server'
import { getEmbeddingModelById, updateModelEmbedDuration } from '@/src/data-access/embedding-models'
import { getAllChunks } from '@/src/data-access/source-texts'
import { getTestPhrases } from '@/src/data-access/test-phrases'
import { saveChunkEmbedding, savePhraseEmbedding } from '@/src/data-access/embeddings'
import { createEmbeddings, type EmbeddingModelConfig } from '@/src/lib/embedding'

const BATCH_SIZE = 50

const SCOPE_LABELS: Record<string, string> = {
    chunks: 'Texte',
    phrases: 'Suchphrasen',
    all: 'Texte & Phrasen',
}

export async function GET(request: NextRequest) {
    const modelId = request.nextUrl.searchParams.get('modelId')
    if (!modelId) {
        return new Response('modelId parameter required', { status: 400 })
    }

    const scope = request.nextUrl.searchParams.get('scope') || 'all'
    if (!['all', 'chunks', 'phrases'].includes(scope)) {
        return new Response('scope must be all, chunks, or phrases', { status: 400 })
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

            const phase = `${model.name} — ${SCOPE_LABELS[scope]}`

            try {
                const chunks = scope !== 'phrases' ? await getAllChunks() : []
                const phrases = scope !== 'chunks' ? await getTestPhrases() : []
                const total = chunks.length + phrases.length
                let current = 0
                const startTime = Date.now()

                for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                    const batch = chunks.slice(i, i + BATCH_SIZE)
                    try {
                        const embeddings = await createEmbeddings(batch.map(c => c.content), config)
                        await Promise.all(
                            batch.map((chunk, idx) => saveChunkEmbedding(chunk.id, modelId, embeddings[idx]))
                        )
                    } catch (err) {
                        send({ type: 'error', message: `Fehler bei Chunk-Batch ${i + 1}-${i + batch.length}: ${err instanceof Error ? err.message : 'Unbekannt'}` })
                    }
                    current += batch.length
                    send({ type: 'progress', current, total, phase, message: `Chunk ${Math.min(current, chunks.length)}/${chunks.length}`, elapsedMs: Date.now() - startTime })
                }

                for (let i = 0; i < phrases.length; i += BATCH_SIZE) {
                    const batch = phrases.slice(i, i + BATCH_SIZE)
                    try {
                        const embeddings = await createEmbeddings(batch.map(p => p.phrase), config)
                        await Promise.all(
                            batch.map((phrase, idx) => savePhraseEmbedding(phrase.id, modelId, embeddings[idx]))
                        )
                    } catch (err) {
                        send({ type: 'error', message: `Fehler bei Phrasen-Batch ${i + 1}-${i + batch.length}: ${err instanceof Error ? err.message : 'Unbekannt'}` })
                    }
                    current += batch.length
                    send({ type: 'progress', current, total, phase, message: `Phrase ${Math.min(current - chunks.length, phrases.length)}/${phrases.length}`, elapsedMs: Date.now() - startTime })
                }

                const totalDurationMs = Date.now() - startTime
                await updateModelEmbedDuration(modelId, totalDurationMs)

                send({
                    type: 'complete',
                    data: {
                        chunksEmbedded: chunks.length,
                        phrasesEmbedded: phrases.length,
                        totalDurationMs,
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
