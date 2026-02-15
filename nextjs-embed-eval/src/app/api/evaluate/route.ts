import { NextRequest } from 'next/server'
import { getEmbeddingModelById } from '@/src/data-access/embedding-models'
import { getTestPhrasesWithEmbeddings } from '@/src/data-access/test-phrases'
import { getPhraseEmbeddingVector } from '@/src/data-access/embeddings'
import { createEvalRun, updateEvalRun, createEvalResult } from '@/src/data-access/evaluation'
import { findSimilarChunks } from '@/src/lib/similarity'

const TOP_K = 5

export async function GET(request: NextRequest) {
    const modelId = request.nextUrl.searchParams.get('modelId')
    if (!modelId) {
        return new Response('modelId parameter required', { status: 400 })
    }

    const model = await getEmbeddingModelById(modelId)
    if (!model) {
        return new Response('Modell nicht gefunden', { status: 404 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }

            try {
                const phrases = await getTestPhrasesWithEmbeddings(modelId)
                const phrasesWithExpected = phrases.filter(p => p.expectedChunkId)

                if (phrasesWithExpected.length === 0) {
                    send({ type: 'error', message: 'Keine Suchphrasen mit erwartetem Chunk gefunden.' })
                    controller.close()
                    return
                }

                const run = await createEvalRun({ modelId })
                const total = phrasesWithExpected.length
                let current = 0

                let totalSimilarity = 0
                let hits1 = 0
                let hits3 = 0
                let hits5 = 0
                let totalReciprocalRank = 0

                const details: Array<{
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
                }> = []

                for (const phrase of phrasesWithExpected) {
                    current++
                    send({ type: 'progress', current, total, message: `Phrase ${current}/${total} auswerten...` })

                    const embedding = await getPhraseEmbeddingVector(phrase.id, modelId)
                    if (!embedding) {
                        send({ type: 'error', message: `Kein Embedding für Phrase "${phrase.phrase}" — bitte zuerst embedden.` })
                        continue
                    }

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
                }

                const n = phrasesWithExpected.length
                const metrics = {
                    avgSimilarity: totalSimilarity / n,
                    topKAccuracy1: hits1 / n,
                    topKAccuracy3: hits3 / n,
                    topKAccuracy5: hits5 / n,
                    mrrScore: totalReciprocalRank / n,
                }

                await updateEvalRun(run.id, metrics)

                send({
                    type: 'complete',
                    data: {
                        runId: run.id,
                        ...metrics,
                        totalPhrases: n,
                        details,
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
