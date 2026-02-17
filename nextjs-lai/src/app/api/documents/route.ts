import { NextRequest, NextResponse } from 'next/server'
import { validateFile, parseDocument } from '@/src/lib/document-parser'
import { chunkDocument } from '@/src/lib/chunking'
import { createEmbeddingsBatchWithProgress } from '@/src/lib/llm'
import { createDocument, createChunks, saveChunkEmbeddingsBatch } from '@/src/data-access/documents'
import { prisma } from '@/src/lib/prisma'
import { generateAndSaveSummary } from '@/src/lib/summary'
import { generateAndSaveToc } from '@/src/lib/toc-extraction'
import { revalidateDocuments } from '@/src/lib/dashboard-cache'

// POST /api/documents - Upload file or paste text, process pipeline with SSE progress
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || ''

        let title: string
        let fileName: string | undefined
        let fileType: string
        let fileSize: number | undefined
        let textContent: string | undefined
        let pageBreaks: number[] | undefined
        let subject: string | undefined
        let fileForParsing: File | undefined

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

            title = (formData.get('title') as string) || file.name.replace(/\.[^.]+$/, '')
            fileName = file.name
            fileType = file.type
            fileSize = file.size
            const rawSubject = formData.get('subject') as string | null
            if (rawSubject?.trim()) subject = rawSubject.trim()

            // Parsing is deferred into the SSE stream so OCR progress can be streamed
            fileForParsing = file
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
                    // Step 1: Parse document (with OCR progress if applicable)
                    if (fileForParsing) {
                        sendProgress('parsing', 5, 'Lernmaterial wird analysiert...')
                        const parsed = await parseDocument(fileForParsing, (current, total, stage) => {
                            const pct = 5 + Math.round((current / total) * 20) // 5–25%
                            sendProgress('ocr', pct, stage)
                        })
                        textContent = parsed.text
                        pageBreaks = parsed.pageBreaks
                    }

                    // Step 2: Save document
                    sendProgress('document', 30, 'Lernmaterial wird gespeichert...')
                    const doc = await createDocument({
                        title,
                        fileName,
                        fileType,
                        fileSize,
                        content: textContent!,
                        subject,
                    })

                    // Step 3: Chunk the text
                    sendProgress('chunking', 35, 'Text wird in Abschnitte unterteilt...')
                    const chunks = chunkDocument({ text: textContent!, pageBreaks })

                    if (chunks.length === 0) {
                        sendProgress('done', 100, 'Lernmaterial gespeichert (keine Abschnitte erstellt).')
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({
                                type: 'complete',
                                documentId: doc.id,
                                chunkCount: 0,
                                totalWords: 0,
                                avgWordsPerChunk: 0,
                                avgTokensPerChunk: 0
                            })}\n\n`)
                        )
                        controller.close()
                        return
                    }

                    // Step 4: Save chunks to database
                    sendProgress('saving', 40, 'Lernabschnitte werden erstellt...')
                    await createChunks(doc.id, chunks)

                    // Fetch created chunk IDs for embedding assignment
                    const savedChunks = await prisma.documentChunk.findMany({
                        where: { documentId: doc.id },
                        orderBy: { chunkIndex: 'asc' },
                        select: { id: true, content: true },
                    })

                    // Step 5: Generate embeddings in batches with progress
                    sendProgress('embedding', 55, `${savedChunks.length} Lernabschnitte werden eingebettet...`)

                    try {
                        const texts = savedChunks.map(c => c.content)
                        const embeddings = await createEmbeddingsBatchWithProgress(texts, (done, total) => {
                            const pct = 55 + Math.round((done / total) * 40)
                            sendProgress('embedding', pct, `Einbettung: ${done} / ${total} Abschnitte`)
                        })
                        const batch = savedChunks.map((c, i) => ({
                            chunkId: c.id,
                            embedding: embeddings[i],
                        }))
                        await saveChunkEmbeddingsBatch(batch)
                    } catch (embeddingError) {
                        console.error('Batch embedding failed:', embeddingError)
                    }

                    // Calculate quality metrics
                    const totalWords = chunks.reduce((sum, chunk) => {
                        const wordCount = chunk.content.trim().split(/\s+/).length
                        return sum + wordCount
                    }, 0)
                    const avgWordsPerChunk = chunks.length > 0 ? Math.round(totalWords / chunks.length) : 0
                    const totalTokens = chunks.reduce((sum, chunk) => sum + (chunk.tokenCount || 0), 0)
                    const avgTokensPerChunk = chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0

                    // Done
                    sendProgress('done', 100, 'Verarbeitung abgeschlossen!')
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({
                            type: 'complete',
                            documentId: doc.id,
                            chunkCount: chunks.length,
                            totalWords,
                            avgWordsPerChunk,
                            avgTokensPerChunk
                        })}\n\n`)
                    )

                    // Fire-and-forget: generate summary and TOC in background
                    generateAndSaveSummary(doc.id).catch(console.error)
                    generateAndSaveToc(doc.id).catch(console.error)
                    revalidateDocuments()
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
