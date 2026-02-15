import { NextRequest } from 'next/server'
import { getEmbeddingModels, getEmbeddingModelById, updateModelEmbedDuration } from '@/src/data-access/embedding-models'
import { getSourceTexts, deleteChunksBySourceText, createChunks, updateSourceText } from '@/src/data-access/source-texts'
import { getTestPhrases } from '@/src/data-access/test-phrases'
import { getAllChunks, getChunksBySourceText } from '@/src/data-access/source-texts'
import { getPhrasesForRemapping, remapPhraseToChunk } from '@/src/data-access/test-phrases'
import { saveChunkEmbedding, savePhraseEmbedding } from '@/src/data-access/embeddings'
import { chunkText, DEFAULT_TARGET_TOKENS, DEFAULT_OVERLAP_TOKENS } from '@/src/lib/chunking'
import { createEmbeddings, type EmbeddingModelConfig } from '@/src/lib/embedding'

const BATCH_SIZE = 50

/**
 * Find the best matching chunk for a given expected content snippet.
 * Uses longest common substring overlap ratio.
 */
function findBestChunkMatch(
    expectedContent: string,
    chunks: Array<{ id: string; content: string }>
): { chunkId: string; score: number } | null {
    if (!expectedContent || chunks.length === 0) return null

    const normalizedExpected = expectedContent.toLowerCase().replace(/\s+/g, ' ').trim()
    let bestId = ''
    let bestScore = 0

    for (const chunk of chunks) {
        const normalizedChunk = chunk.content.toLowerCase().replace(/\s+/g, ' ').trim()

        // Check bidirectional containment
        if (normalizedChunk.includes(normalizedExpected)) {
            // New chunk fully contains the expected content — perfect match
            const score = normalizedExpected.length / normalizedChunk.length
            if (score > bestScore || (score === bestScore && !bestId)) {
                bestScore = 1.0 // full containment → max score
                bestId = chunk.id
            }
        } else if (normalizedExpected.includes(normalizedChunk)) {
            // Expected content is larger than new chunk — partial match
            const score = normalizedChunk.length / normalizedExpected.length
            if (score > bestScore) {
                bestScore = score
                bestId = chunk.id
            }
        } else {
            // Check word overlap as fallback
            const expectedWords = new Set(normalizedExpected.split(' '))
            const chunkWords = normalizedChunk.split(' ')
            const overlap = chunkWords.filter(w => expectedWords.has(w)).length
            const score = overlap / Math.max(expectedWords.size, chunkWords.length)
            if (score > bestScore) {
                bestScore = score
                bestId = chunk.id
            }
        }
    }

    return bestId ? { chunkId: bestId, score: bestScore } : null
}

export async function GET(request: NextRequest) {
    const chunkSize = parseInt(request.nextUrl.searchParams.get('chunkSize') || '') || DEFAULT_TARGET_TOKENS
    const chunkOverlap = parseInt(request.nextUrl.searchParams.get('chunkOverlap') || '') || DEFAULT_OVERLAP_TOKENS
    const modelId = request.nextUrl.searchParams.get('modelId') // null = all models

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }

            try {
                // --- Phase 1: Re-chunk ---
                send({ type: 'progress', current: 0, total: 100, phase: `Re-Chunking (${chunkSize} Tokens, ${chunkOverlap} Overlap)`, message: 'Texte laden...' })

                const sourceTexts = await getSourceTexts()
                let totalNewChunks = 0

                for (const st of sourceTexts) {
                    await deleteChunksBySourceText(st.id)
                    await updateSourceText(st.id, { chunkSize, chunkOverlap })
                    const newChunks = chunkText({ text: st.content }, { targetTokens: chunkSize, overlapTokens: chunkOverlap })
                    if (newChunks.length > 0) {
                        await createChunks(st.id, newChunks)
                    }
                    totalNewChunks += newChunks.length
                }

                send({ type: 'progress', current: 0, total: 100, phase: `Re-Chunking abgeschlossen`, message: `${totalNewChunks} Chunks erstellt aus ${sourceTexts.length} Texten` })

                // --- Phase 1.5: Auto-remap phrase ground truth ---
                const phrasesToRemap = await getPhrasesForRemapping()
                let remapped = 0
                let remapFailed = 0

                if (phrasesToRemap.length > 0) {
                    send({ type: 'progress', current: 0, total: 100, phase: 'Phrasen-Mapping aktualisieren', message: `${phrasesToRemap.length} Phrasen werden neu zugeordnet...` })

                    // Group phrases by sourceTextId for efficient chunk loading
                    const phrasesBySource = new Map<string, typeof phrasesToRemap>()
                    for (const p of phrasesToRemap) {
                        const list = phrasesBySource.get(p.sourceTextId!) || []
                        list.push(p)
                        phrasesBySource.set(p.sourceTextId!, list)
                    }

                    for (const [sourceTextId, phrases] of phrasesBySource) {
                        const newChunks = await getChunksBySourceText(sourceTextId)

                        for (const phrase of phrases) {
                            const match = findBestChunkMatch(
                                phrase.expectedContent!,
                                newChunks.map(c => ({ id: c.id, content: c.content }))
                            )
                            if (match && match.score >= 0.3) {
                                await remapPhraseToChunk(phrase.id, match.chunkId)
                                remapped++
                            } else {
                                remapFailed++
                            }
                        }
                    }

                    const remapMsg = remapFailed > 0
                        ? `${remapped} Phrasen neu zugeordnet, ${remapFailed} konnten nicht zugeordnet werden`
                        : `${remapped} Phrasen erfolgreich neu zugeordnet`
                    send({ type: 'progress', current: 0, total: 100, phase: 'Phrasen-Mapping', message: remapMsg })
                }

                // --- Phase 2: Embed ---
                let models: Array<{ id: string; name: string; provider: string; providerUrl: string; dimensions: number; queryPrefix: string | null; documentPrefix: string | null }>

                if (modelId) {
                    const m = await getEmbeddingModelById(modelId)
                    if (!m) {
                        send({ type: 'error', message: 'Modell nicht gefunden' })
                        controller.close()
                        return
                    }
                    models = [m]
                } else {
                    models = await getEmbeddingModels()
                }

                if (models.length === 0) {
                    send({ type: 'error', message: 'Keine Modelle registriert' })
                    controller.close()
                    return
                }

                const chunks = await getAllChunks()
                const phrases = await getTestPhrases()
                const itemsPerModel = chunks.length + phrases.length
                const totalItems = itemsPerModel * models.length
                let globalCurrent = 0
                const globalStart = Date.now()
                let totalChunksEmbedded = 0
                let totalPhrasesEmbedded = 0

                for (let mi = 0; mi < models.length; mi++) {
                    const model = models[mi]
                    const phase = models.length > 1
                        ? `Embedding Modell ${mi + 1}/${models.length}: ${model.name}`
                        : `Embedding: ${model.name}`

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
                        const batch = chunks.slice(i, i + BATCH_SIZE)
                        try {
                            const embeddings = await createEmbeddings(batch.map(c => c.content), config, 'document')
                            await Promise.all(
                                batch.map((chunk, idx) => saveChunkEmbedding(chunk.id, model.id, embeddings[idx]))
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
                        const batch = phrases.slice(i, i + BATCH_SIZE)
                        try {
                            const embeddings = await createEmbeddings(batch.map(p => p.phrase), config, 'query')
                            await Promise.all(
                                batch.map((phrase, idx) => savePhraseEmbedding(phrase.id, model.id, embeddings[idx]))
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
                        chunkSize,
                        chunkOverlap,
                        totalChunks: totalNewChunks,
                        modelsProcessed: models.length,
                        chunksEmbedded: totalChunksEmbedded,
                        phrasesEmbedded: totalPhrasesEmbedded,
                        phrasesRemapped: remapped,
                        phrasesRemapFailed: remapFailed,
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
