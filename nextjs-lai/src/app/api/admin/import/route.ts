import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { prisma } from '@/src/lib/prisma'
import { chunkDocument } from '@/src/lib/chunking'
import { createEmbedding } from '@/src/lib/llm'
import { createDocument, createChunks, saveChunkEmbedding } from '@/src/data-access/documents'

const LM_BASE = path.resolve(process.cwd(), '..', 'machineLearning', 'languageModel')

// Extract text content from a Jupyter notebook JSON
function extractNotebookText(raw: string): string {
    const nb = JSON.parse(raw)
    const cells: { cell_type: string; source: string | string[] }[] = nb.cells || []
    const parts: string[] = []

    for (const cell of cells) {
        if (cell.cell_type !== 'markdown' && cell.cell_type !== 'code') continue
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source
        if (!source.trim()) continue

        if (cell.cell_type === 'code') {
            parts.push('```python\n' + source + '\n```')
        } else {
            parts.push(source)
        }
    }

    return parts.join('\n\n')
}

// POST /api/admin/import - Batch import local files with SSE progress
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const files: string[] = body.files

        if (!Array.isArray(files) || files.length === 0) {
            return new Response(JSON.stringify({ error: 'Keine Dateien angegeben.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Validate all paths are within LM_BASE (path traversal protection)
        for (const relativePath of files) {
            const resolved = path.resolve(LM_BASE, relativePath)
            if (!resolved.startsWith(LM_BASE)) {
                return new Response(JSON.stringify({ error: `Ungültiger Pfad: ${relativePath}` }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                })
            }
        }

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                function send(data: Record<string, unknown>) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                }

                const results: { file: string; status: 'imported' | 'skipped' | 'error'; error?: string }[] = []

                for (let i = 0; i < files.length; i++) {
                    const relativePath = files[i]
                    const fileName = path.basename(relativePath)
                    const absolutePath = path.resolve(LM_BASE, relativePath)

                    send({ type: 'file_start', file: relativePath, index: i, total: files.length })

                    try {
                        // Duplicate check
                        const existing = await prisma.document.findFirst({
                            where: { fileName },
                        })
                        if (existing) {
                            send({ type: 'file_skip', file: relativePath, reason: 'Bereits importiert' })
                            results.push({ file: relativePath, status: 'skipped' })
                            continue
                        }

                        // Read file
                        send({ type: 'progress', file: relativePath, step: 'document', detail: 'Datei wird gelesen...' })
                        const rawContent = await fs.readFile(absolutePath, 'utf-8')
                        const fileStats = await fs.stat(absolutePath)
                        const isNotebook = fileName.endsWith('.ipynb')
                        const textContent = isNotebook ? extractNotebookText(rawContent) : rawContent

                        // Create document
                        send({ type: 'progress', file: relativePath, step: 'document', detail: 'Lernmaterial wird gespeichert...' })
                        const title = fileName.replace(/\.(md|ipynb)$/, '').replace(/_/g, ' ')
                        const doc = await createDocument({
                            title,
                            fileName,
                            fileType: isNotebook ? 'application/x-ipynb+json' : 'text/markdown',
                            fileSize: fileStats.size,
                            content: textContent,
                        })

                        // Chunk the document
                        send({ type: 'progress', file: relativePath, step: 'chunking', detail: 'Text wird in Abschnitte unterteilt...' })
                        const chunks = chunkDocument({ text: textContent })

                        if (chunks.length > 0) {
                            // Save chunks
                            await createChunks(doc.id, chunks)

                            // Fetch saved chunk IDs
                            const savedChunks = await prisma.documentChunk.findMany({
                                where: { documentId: doc.id },
                                orderBy: { chunkIndex: 'asc' },
                                select: { id: true, content: true },
                            })

                            // Generate embeddings
                            for (let j = 0; j < savedChunks.length; j++) {
                                send({
                                    type: 'progress',
                                    file: relativePath,
                                    step: 'embedding',
                                    detail: `Lernabschnitt ${j + 1}/${savedChunks.length} wird erstellt...`,
                                })

                                try {
                                    const embedding = await createEmbedding(savedChunks[j].content)
                                    await saveChunkEmbedding(savedChunks[j].id, embedding)
                                } catch (embeddingError) {
                                    console.error(`Embedding failed for chunk ${j} of ${fileName}:`, embeddingError)
                                }
                            }
                        }

                        send({
                            type: 'file_complete',
                            file: relativePath,
                            documentId: doc.id,
                            chunkCount: chunks.length,
                        })
                        results.push({ file: relativePath, status: 'imported' })
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
                        console.error(`Import error for ${relativePath}:`, error)
                        send({ type: 'file_error', file: relativePath, error: message })
                        results.push({ file: relativePath, status: 'error', error: message })
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
        console.error('Import error:', error)
        return new Response(JSON.stringify({ error: 'Import fehlgeschlagen.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
