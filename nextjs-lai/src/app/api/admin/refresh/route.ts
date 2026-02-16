import { NextRequest } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { chunkDocument } from '@/src/lib/chunking'
import { createEmbeddingsBatchWithProgress } from '@/src/lib/llm'
import {
    deleteChunksByDocument,
    createChunks,
    saveChunkEmbeddingsBatch,
    getDocumentsWithChunkCount,
} from '@/src/data-access/documents'

// GET /api/admin/refresh - List all documents available for refresh
export async function GET() {
    try {
        const docs = await getDocumentsWithChunkCount()
        return Response.json({ documents: docs })
    } catch (error) {
        console.error('Refresh list error:', error)
        return Response.json({ error: 'Lernmaterial konnte nicht geladen werden.' }, { status: 500 })
    }
}

// POST /api/admin/refresh - Re-chunk and re-embed selected documents (SSE)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const documentIds: string[] = body.documentIds

        if (!Array.isArray(documentIds) || documentIds.length === 0) {
            return Response.json({ error: 'Kein Lernmaterial ausgewählt.' }, { status: 400 })
        }

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                function send(data: Record<string, unknown>) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                }

                const results: { id: string; title: string; status: 'refreshed' | 'error'; error?: string }[] = []

                for (let i = 0; i < documentIds.length; i++) {
                    const docId = documentIds[i]

                    // Fetch document with content
                    const doc = await prisma.document.findUnique({
                        where: { id: docId },
                        select: { id: true, title: true, content: true },
                    })

                    if (!doc) {
                        send({ type: 'doc_error', id: docId, error: 'Lernmaterial nicht gefunden' })
                        results.push({ id: docId, title: docId, status: 'error', error: 'Nicht gefunden' })
                        continue
                    }

                    send({ type: 'doc_start', id: doc.id, title: doc.title, index: i, total: documentIds.length })

                    try {
                        // Delete old chunks
                        send({ type: 'progress', id: doc.id, step: 'cleanup', detail: 'Alte Chunks werden entfernt...' })
                        await deleteChunksByDocument(doc.id)

                        // Re-chunk
                        send({ type: 'progress', id: doc.id, step: 'chunking', detail: 'Text wird neu unterteilt...' })
                        const chunks = chunkDocument({ text: doc.content })

                        if (chunks.length === 0) {
                            send({ type: 'doc_complete', id: doc.id, title: doc.title, chunkCount: 0 })
                            results.push({ id: doc.id, title: doc.title, status: 'refreshed' })
                            continue
                        }

                        // Save new chunks
                        await createChunks(doc.id, chunks)

                        // Fetch saved chunk IDs
                        const savedChunks = await prisma.documentChunk.findMany({
                            where: { documentId: doc.id },
                            orderBy: { chunkIndex: 'asc' },
                            select: { id: true, content: true },
                        })

                        // Generate embeddings in batches with progress
                        send({
                            type: 'progress',
                            id: doc.id,
                            step: 'embedding',
                            detail: `${savedChunks.length} Lernabschnitte werden eingebettet...`,
                        })

                        try {
                            const texts = savedChunks.map(c => c.content)
                            const embeddings = await createEmbeddingsBatchWithProgress(texts, (done, total) => {
                                send({
                                    type: 'progress',
                                    id: doc.id,
                                    step: 'embedding',
                                    detail: `Einbettung: ${done} / ${total} Abschnitte`,
                                })
                            })
                            const batch = savedChunks.map((c, j) => ({
                                chunkId: c.id,
                                embedding: embeddings[j],
                            }))
                            await saveChunkEmbeddingsBatch(batch)
                        } catch (embeddingError) {
                            console.error(`Batch embedding failed for ${doc.title}:`, embeddingError)
                        }

                        send({ type: 'doc_complete', id: doc.id, title: doc.title, chunkCount: chunks.length })
                        results.push({ id: doc.id, title: doc.title, status: 'refreshed' })
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
                        console.error(`Refresh error for ${doc.title}:`, error)
                        send({ type: 'doc_error', id: doc.id, title: doc.title, error: message })
                        results.push({ id: doc.id, title: doc.title, status: 'error', error: message })
                    }
                }

                send({ type: 'batch_complete', results })
                controller.close()
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        })
    } catch (error) {
        console.error('Refresh error:', error)
        return Response.json({ error: 'Aktualisierung fehlgeschlagen.' }, { status: 500 })
    }
}
