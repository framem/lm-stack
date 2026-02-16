import { NextRequest } from 'next/server'
import { getEmbeddingModelById } from '@/src/data-access/embedding-models'
import { getSourceTexts, deleteChunksBySourceText, createChunks, updateSourceText, getAllChunks, getChunksBySourceText } from '@/src/data-access/source-texts'
import { getTestPhrases, getPhrasesForRemapping, remapPhraseToChunk, getTestPhrasesWithEmbeddings } from '@/src/data-access/test-phrases'
import { saveChunkEmbedding, savePhraseEmbedding, getPhraseEmbeddingVector } from '@/src/data-access/embeddings'
import { createEvalRun, updateEvalRun, createEvalResult } from '@/src/data-access/evaluation'
import { chunkText, type ChunkStrategy } from '@/src/lib/chunking'
import { createEmbeddings, type EmbeddingModelConfig } from '@/src/lib/embedding'
import { findSimilarChunks } from '@/src/lib/similarity'
import { prisma } from '@/src/lib/prisma'

const BATCH_SIZE = 50
const TOP_K = 5

// ---- Types ----

interface GridConfig {
    chunkSize: number
    chunkOverlap: number
    strategy: ChunkStrategy
}

interface GridMetrics {
    avgSimilarity: number
    topKAccuracy1: number
    topKAccuracy3: number
    topKAccuracy5: number
    mrrScore: number
    ndcgScore: number
}

interface GridResult {
    config: GridConfig
    metrics: GridMetrics
    runId: string
    totalChunks: number
    totalPhrases: number
}

// ---- Helpers (reused from rechunk-embed) ----

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

        if (normalizedChunk.includes(normalizedExpected)) {
            const score = normalizedExpected.length / normalizedChunk.length
            if (score > bestScore || (score === bestScore && !bestId)) {
                bestScore = 1.0
                bestId = chunk.id
            }
        } else if (normalizedExpected.includes(normalizedChunk)) {
            const score = normalizedChunk.length / normalizedExpected.length
            if (score > bestScore) {
                bestScore = score
                bestId = chunk.id
            }
        } else {
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

/**
 * Re-chunk all source texts with the given config.
 * Returns the total number of new chunks created.
 */
async function rechunkAllTexts(config: GridConfig): Promise<number> {
    const sourceTexts = await getSourceTexts()
    let totalNewChunks = 0

    for (const st of sourceTexts) {
        await deleteChunksBySourceText(st.id)
        await updateSourceText(st.id, {
            chunkSize: config.chunkSize,
            chunkOverlap: config.chunkOverlap,
            chunkStrategy: config.strategy,
        })
        const newChunks = chunkText(
            { text: st.content },
            { targetTokens: config.chunkSize, overlapTokens: config.chunkOverlap, strategy: config.strategy }
        )
        if (newChunks.length > 0) {
            await createChunks(st.id, newChunks)
        }
        totalNewChunks += newChunks.length
    }

    return totalNewChunks
}

/**
 * Auto-remap phrase ground truth to newly created chunks.
 * Returns count of remapped and failed phrases.
 */
async function remapPhrases(): Promise<{ remapped: number; failed: number }> {
    const phrasesToRemap = await getPhrasesForRemapping()
    let remapped = 0
    let failed = 0

    if (phrasesToRemap.length === 0) return { remapped: 0, failed: 0 }

    // Group by sourceTextId for efficient chunk loading
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
                failed++
            }
        }
    }

    return { remapped, failed }
}

/**
 * Embed all chunks and phrases for a given model.
 */
async function embedAll(
    modelConfig: EmbeddingModelConfig,
    modelId: string,
    send: (data: Record<string, unknown>) => void,
    configLabel: string
): Promise<void> {
    const chunks = await getAllChunks()
    const phrases = await getTestPhrases()

    // Embed chunks in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE)
        try {
            const embeddings = await createEmbeddings(batch.map(c => c.content), modelConfig, 'document')
            await Promise.all(
                batch.map((chunk, idx) => saveChunkEmbedding(chunk.id, modelId, embeddings[idx]))
            )
        } catch (err) {
            send({
                type: 'progress',
                message: `Fehler bei Chunk-Batch: ${err instanceof Error ? err.message : 'Unbekannt'}`,
            })
        }
        send({
            type: 'progress',
            message: `${configLabel} — Chunks einbetten: ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}`,
        })
    }

    // Embed phrases in batches
    for (let i = 0; i < phrases.length; i += BATCH_SIZE) {
        const batch = phrases.slice(i, i + BATCH_SIZE)
        try {
            const embeddings = await createEmbeddings(batch.map(p => p.phrase), modelConfig, 'query')
            await Promise.all(
                batch.map((phrase, idx) => savePhraseEmbedding(phrase.id, modelId, embeddings[idx]))
            )
        } catch (err) {
            send({
                type: 'progress',
                message: `Fehler bei Phrasen-Batch: ${err instanceof Error ? err.message : 'Unbekannt'}`,
            })
        }
    }
}

/**
 * Run evaluation for the current chunk/embedding state.
 * Returns metrics and the eval run ID.
 */
interface PhraseDetail {
    phrase: string
    category: string | null
    expectedChunk: {
        chunkIndex: number
        content: string
        sourceTitle: string
    } | null
    retrievedChunks: Array<{
        chunkIndex: number
        content: string
        sourceTitle: string
        similarity: number
        isExpected: boolean
    }>
    expectedRank: number | null
    isHit: boolean
}

async function runEvaluation(
    modelId: string,
    config: GridConfig,
    send: (data: Record<string, unknown>) => void,
    configLabel: string,
): Promise<{ metrics: GridMetrics; runId: string; totalPhrases: number; totalChunks: number; details: PhraseDetail[] }> {
    const phrases = await getTestPhrasesWithEmbeddings(modelId)
    const phrasesWithExpected = phrases.filter(p => p.expectedChunkId)

    if (phrasesWithExpected.length === 0) {
        throw new Error('Keine Suchphrasen mit erwartetem Chunk gefunden.')
    }

    const totalChunks = await prisma.textChunk.count()

    const run = await createEvalRun({
        modelId,
        chunkSize: config.chunkSize,
        chunkOverlap: config.chunkOverlap,
        chunkStrategy: config.strategy,
        totalChunks,
        totalPhrases: phrasesWithExpected.length,
    })

    let totalSimilarity = 0
    let hits1 = 0
    let hits3 = 0
    let hits5 = 0
    let totalReciprocalRank = 0
    let totalNdcg = 0
    const details: PhraseDetail[] = []

    for (let i = 0; i < phrasesWithExpected.length; i++) {
        const phrase = phrasesWithExpected[i]

        const embedding = await getPhraseEmbeddingVector(phrase.id, modelId)
        if (!embedding) continue

        const similar = await findSimilarChunks(embedding, modelId, TOP_K)
        const retrievedIds = similar.map(s => s.chunkId)
        const similarities = similar.map(s => Number(s.similarity))

        const expectedRank = retrievedIds.indexOf(phrase.expectedChunkId!) + 1
        const isHit = expectedRank > 0

        if (isHit) {
            if (expectedRank <= 1) hits1++
            if (expectedRank <= 3) hits3++
            if (expectedRank <= 5) hits5++
            totalReciprocalRank += 1 / expectedRank
            totalNdcg += 1 / Math.log2(expectedRank + 1)
        }

        if (similarities.length > 0) {
            totalSimilarity += similarities[0]
        }

        await createEvalResult({
            runId: run.id,
            phraseId: phrase.id,
            retrievedChunkIds: retrievedIds,
            similarities,
            expectedChunkRank: isHit ? expectedRank : null,
            isHit,
        })

        details.push({
            phrase: phrase.phrase,
            category: phrase.category,
            expectedChunk: phrase.expectedChunk
                ? {
                    chunkIndex: phrase.expectedChunk.chunkIndex,
                    content: phrase.expectedChunk.content,
                    sourceTitle: phrase.expectedChunk.sourceText.title,
                }
                : null,
            retrievedChunks: similar.map(s => ({
                chunkIndex: s.chunkIndex,
                content: s.content,
                sourceTitle: s.sourceTitle,
                similarity: Number(s.similarity),
                isExpected: s.chunkId === phrase.expectedChunkId,
            })),
            expectedRank: isHit ? expectedRank : null,
            isHit,
        })

        if ((i + 1) % 5 === 0 || i === phrasesWithExpected.length - 1) {
            send({
                type: 'progress',
                message: `${configLabel} — Evaluierung: ${i + 1}/${phrasesWithExpected.length} Phrasen`,
            })
        }
    }

    const n = phrasesWithExpected.length
    const metrics: GridMetrics = {
        avgSimilarity: totalSimilarity / n,
        topKAccuracy1: hits1 / n,
        topKAccuracy3: hits3 / n,
        topKAccuracy5: hits5 / n,
        mrrScore: totalReciprocalRank / n,
        ndcgScore: totalNdcg / n,
    }

    await updateEvalRun(run.id, metrics)

    return { metrics, runId: run.id, totalPhrases: n, totalChunks, details }
}

// ---- Route handler ----

export async function GET(request: NextRequest) {
    const modelId = request.nextUrl.searchParams.get('modelId')
    if (!modelId) {
        return new Response('modelId parameter required', { status: 400 })
    }

    const model = await getEmbeddingModelById(modelId)
    if (!model) {
        return new Response('Modell nicht gefunden', { status: 404 })
    }

    // Parse config ranges from query params
    const chunkSizes = (request.nextUrl.searchParams.get('chunkSizes') || '100,200,300,500')
        .split(',').map(Number).filter(n => n > 0)
    const chunkOverlaps = (request.nextUrl.searchParams.get('chunkOverlaps') || '0,30,60')
        .split(',').map(Number).filter(n => n >= 0)
    const strategies = (request.nextUrl.searchParams.get('strategies') || 'sentence')
        .split(',').filter(Boolean) as ChunkStrategy[]

    // Build all combinations
    const configs: GridConfig[] = []
    for (const size of chunkSizes) {
        for (const overlap of chunkOverlaps) {
            // Skip invalid configs where overlap >= chunk size
            if (overlap >= size) continue
            for (const strategy of strategies) {
                configs.push({ chunkSize: size, chunkOverlap: overlap, strategy })
            }
        }
    }

    if (configs.length === 0) {
        return new Response('Keine gültigen Konfigurationen. Overlap muss kleiner als Chunk-Größe sein.', { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }

            try {
                const results: GridResult[] = []
                const modelConfig: EmbeddingModelConfig = {
                    name: model.name,
                    provider: model.provider,
                    providerUrl: model.providerUrl,
                    dimensions: model.dimensions,
                    queryPrefix: model.queryPrefix,
                    documentPrefix: model.documentPrefix,
                }

                for (let i = 0; i < configs.length; i++) {
                    const config = configs[i]
                    const configLabel = `${config.chunkSize}t / ${config.chunkOverlap}o / ${config.strategy}`

                    // Signal which config we are starting
                    send({
                        type: 'config',
                        current: i + 1,
                        total: configs.length,
                        chunkSize: config.chunkSize,
                        chunkOverlap: config.chunkOverlap,
                        strategy: config.strategy,
                    })

                    // Step 1: Re-chunk
                    send({ type: 'progress', message: `${configLabel} — Texte neu chunken...` })
                    const totalChunks = await rechunkAllTexts(config)
                    send({ type: 'progress', message: `${configLabel} — ${totalChunks} Chunks erstellt` })

                    // Step 2: Remap phrases
                    send({ type: 'progress', message: `${configLabel} — Phrasen-Mapping aktualisieren...` })
                    const { remapped, failed } = await remapPhrases()
                    send({ type: 'progress', message: `${configLabel} — ${remapped} Phrasen zugeordnet${failed > 0 ? `, ${failed} fehlgeschlagen` : ''}` })

                    // Step 3: Embed
                    send({ type: 'progress', message: `${configLabel} — Embeddings erstellen...` })
                    await embedAll(modelConfig, modelId, send, configLabel)

                    // Step 4: Evaluate
                    send({ type: 'progress', message: `${configLabel} — Evaluierung starten...` })
                    const evalResult = await runEvaluation(modelId, config, send, configLabel)

                    const result: GridResult & { details: PhraseDetail[] } = {
                        config,
                        metrics: evalResult.metrics,
                        runId: evalResult.runId,
                        totalChunks: evalResult.totalChunks,
                        totalPhrases: evalResult.totalPhrases,
                        details: evalResult.details,
                    }
                    results.push(result)

                    // Stream individual result (including per-phrase details)
                    send({
                        type: 'result',
                        config: result.config,
                        metrics: result.metrics,
                        runId: result.runId,
                        totalChunks: result.totalChunks,
                        totalPhrases: result.totalPhrases,
                        details: result.details,
                    })
                }

                // Determine recommendation: highest Top-1, then MRR, then smallest chunk size
                const recommendation = [...results].sort((a, b) => {
                    if (b.metrics.topKAccuracy1 !== a.metrics.topKAccuracy1) {
                        return b.metrics.topKAccuracy1 - a.metrics.topKAccuracy1
                    }
                    if (b.metrics.mrrScore !== a.metrics.mrrScore) {
                        return b.metrics.mrrScore - a.metrics.mrrScore
                    }
                    return a.config.chunkSize - b.config.chunkSize
                })[0]

                send({
                    type: 'complete',
                    data: {
                        results,
                        recommendation: recommendation
                            ? {
                                chunkSize: recommendation.config.chunkSize,
                                chunkOverlap: recommendation.config.chunkOverlap,
                                strategy: recommendation.config.strategy,
                                metrics: recommendation.metrics,
                                runId: recommendation.runId,
                            }
                            : null,
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
