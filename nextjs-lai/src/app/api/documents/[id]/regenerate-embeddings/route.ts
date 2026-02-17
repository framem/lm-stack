import { NextRequest } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { createEmbeddingsBatchWithProgress } from '@/src/lib/llm'
import { saveChunkEmbeddingsBatch } from '@/src/data-access/documents'

// POST /api/documents/[id]/regenerate-embeddings - Regenerate embeddings for chunks without embeddings (SSE)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Check if document exists
        const doc = await prisma.document.findUnique({
            where: { id },
            select: { id: true, title: true },
        })

        if (!doc) {
            return Response.json({ error: 'Lernmaterial nicht gefunden.' }, { status: 404 })
        }

        // SSE stream for embedding progress
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                function send(data: Record<string, unknown>) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                }

                try {
                    // Find all chunks without embeddings
                    send({ type: 'progress', step: 'checking', detail: 'Prüfe Lernabschnitte...' })

                    const chunksWithoutEmbeddings = await prisma.documentChunk.findMany({
                        where: {
                            documentId: id,
                            embedding: null,
                        },
                        orderBy: { chunkIndex: 'asc' },
                        select: { id: true, content: true },
                    })

                    if (chunksWithoutEmbeddings.length === 0) {
                        send({
                            type: 'complete',
                            message: 'Alle Lernabschnitte haben bereits Embeddings.',
                            regeneratedCount: 0
                        })
                        controller.close()
                        return
                    }

                    send({
                        type: 'progress',
                        step: 'found',
                        detail: `${chunksWithoutEmbeddings.length} Lernabschnitte ohne Embeddings gefunden.`
                    })

                    // Generate embeddings in batches with progress
                    send({
                        type: 'progress',
                        step: 'embedding',
                        detail: `Embeddings für ${chunksWithoutEmbeddings.length} Lernabschnitte werden generiert...`,
                    })

                    const texts = chunksWithoutEmbeddings.map(c => c.content)
                    const embeddings = await createEmbeddingsBatchWithProgress(texts, (done, total) => {
                        send({
                            type: 'progress',
                            step: 'embedding',
                            progress: Math.round((done / total) * 100),
                            detail: `Einbettung: ${done} / ${total} Abschnitte`,
                        })
                    })

                    // Save embeddings to database
                    send({ type: 'progress', step: 'saving', detail: 'Embeddings werden gespeichert...' })

                    const batch = chunksWithoutEmbeddings.map((c, i) => ({
                        chunkId: c.id,
                        embedding: embeddings[i],
                    }))
                    await saveChunkEmbeddingsBatch(batch)

                    send({
                        type: 'complete',
                        message: `${chunksWithoutEmbeddings.length} Embeddings erfolgreich regeneriert.`,
                        regeneratedCount: chunksWithoutEmbeddings.length
                    })
                    controller.close()
                } catch (error) {
                    console.error('Embedding regeneration error:', error)
                    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
                    send({
                        type: 'error',
                        error: `Regenerierung fehlgeschlagen: ${message}`
                    })
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
    } catch (error) {
        console.error('Regenerate embeddings error:', error)
        return Response.json({ error: 'Regenerierung fehlgeschlagen.' }, { status: 500 })
    }
}
