import { NextRequest, NextResponse } from 'next/server'
import { validateFile, parseDocument } from '@/src/lib/document-parser'
import { chunkDocument } from '@/src/lib/chunking'
import { createEmbedding } from '@/src/lib/llm'
import { createDocument, createChunks, saveChunkEmbedding } from '@/src/data-access/documents'
import { prisma } from '@/src/lib/prisma'

// POST /api/documents - Upload file or paste text, process pipeline with SSE progress
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || ''

        let title: string
        let fileName: string | undefined
        let fileType: string
        let fileSize: number | undefined
        let textContent: string
        let pageBreaks: number[] | undefined
        let subject: string | undefined

        if (contentType.includes('multipart/form-data')) {
            // File upload via FormData
            const formData = await request.formData()
            const file = formData.get('file') as File | null

            if (!file) {
                return NextResponse.json(
                    { error: 'Keine Datei ausgewählt.' },
                    { status: 400 }
                )
            }

            const validation = validateFile(file)
            if (!validation.valid) {
                return NextResponse.json(
                    { error: validation.error },
                    { status: 400 }
                )
            }

            const parsed = await parseDocument(file)
            title = (formData.get('title') as string) || file.name.replace(/\.[^.]+$/, '')
            fileName = file.name
            fileType = file.type
            fileSize = file.size
            textContent = parsed.text
            pageBreaks = parsed.pageBreaks
            const rawSubject = formData.get('subject') as string | null
            if (rawSubject?.trim()) subject = rawSubject.trim()
        } else {
            // JSON text paste
            const body = await request.json()
            if (!body.text || typeof body.text !== 'string' || !body.text.trim()) {
                return NextResponse.json(
                    { error: 'Kein Text angegeben.' },
                    { status: 400 }
                )
            }
            title = body.title || 'Eingefügter Text'
            fileType = 'text/plain'
            textContent = body.text
            if (body.subject && typeof body.subject === 'string' && body.subject.trim()) {
                subject = body.subject.trim()
            }
        }

        // SSE stream for pipeline progress
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                function sendProgress(step: string, progress: number, detail?: string) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'progress', step, progress, detail })}\n\n`)
                    )
                }

                try {
                    // Step 1: Save document
                    sendProgress('document', 10, 'Lernmaterial wird gespeichert...')
                    const doc = await createDocument({
                        title,
                        fileName,
                        fileType,
                        fileSize,
                        content: textContent,
                        subject,
                    })

                    // Step 2: Chunk the text
                    sendProgress('chunking', 30, 'Text wird in Abschnitte unterteilt...')
                    const chunks = chunkDocument({ text: textContent, pageBreaks })

                    if (chunks.length === 0) {
                        sendProgress('done', 100, 'Lernmaterial gespeichert (keine Abschnitte erstellt).')
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ type: 'complete', documentId: doc.id, chunkCount: 0 })}\n\n`)
                        )
                        controller.close()
                        return
                    }

                    // Step 3: Save chunks to database
                    sendProgress('saving', 40, 'Lernabschnitte werden erstellt...')
                    await createChunks(doc.id, chunks)

                    // Fetch created chunk IDs for embedding assignment
                    const savedChunks = await prisma.documentChunk.findMany({
                        where: { documentId: doc.id },
                        orderBy: { chunkIndex: 'asc' },
                        select: { id: true, content: true },
                    })

                    // Step 4: Generate embeddings
                    for (let i = 0; i < savedChunks.length; i++) {
                        const chunk = savedChunks[i]
                        const progress = 50 + Math.round((i / savedChunks.length) * 45)
                        sendProgress('embedding', progress, `Lernabschnitt ${i + 1}/${savedChunks.length} wird erstellt...`)

                        try {
                            const embedding = await createEmbedding(chunk.content)
                            await saveChunkEmbedding(chunk.id, embedding)
                        } catch (embeddingError) {
                            console.error(`Embedding failed for chunk ${i}:`, embeddingError)
                            // Continue with other chunks even if one fails
                        }
                    }

                    // Done
                    sendProgress('done', 100, 'Verarbeitung abgeschlossen!')
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'complete', documentId: doc.id, chunkCount: chunks.length })}\n\n`)
                    )
                } catch (error) {
                    console.error('Pipeline error:', error)
                    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'error', error: `Verarbeitung fehlgeschlagen: ${message}` })}\n\n`)
                    )
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
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Hochladen fehlgeschlagen.' },
            { status: 500 }
        )
    }
}
