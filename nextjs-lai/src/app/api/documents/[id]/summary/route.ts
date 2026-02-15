import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { getModel } from '@/src/lib/llm'
import { getDocumentWithChunks, updateDocument } from '@/src/data-access/documents'

// POST /api/documents/[id]/summary - Generate a streaming summary for a document
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const document = await getDocumentWithChunks(id)

        if (!document) {
            return Response.json({ error: 'Lernmaterial nicht gefunden.' }, { status: 404 })
        }

        if (!document.chunks || document.chunks.length === 0) {
            return Response.json({ error: 'Keine Textabschnitte vorhanden.' }, { status: 400 })
        }

        // Use first ~10 chunks for summary (to stay within context limits)
        const contextChunks = document.chunks
            .sort((a, b) => a.chunkIndex - b.chunkIndex)
            .slice(0, 10)
        const context = contextChunks.map(c => c.content).join('\n\n')

        const result = streamText({
            model: getModel(),
            system: `Du bist ein Zusammenfassungs-Assistent. Erstelle eine prägnante, strukturierte Zusammenfassung des folgenden Lernmaterials in 3-5 Absätzen. Nutze Aufzählungspunkte für die wichtigsten Konzepte. Antworte auf Deutsch.`,
            prompt: `Fasse folgendes Lernmaterial zusammen:\n\n${context}`,
        })

        // Accumulate the full text for DB storage
        let fullText = ''
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.textStream) {
                        fullText += chunk
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`))
                    }

                    // Save summary to document
                    await updateDocument(id, { summary: fullText })
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', summary: fullText })}\n\n`))
                } catch (error) {
                    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler'
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`))
                } finally {
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        })
    } catch (error) {
        console.error('Summary generation error:', error)
        return Response.json({ error: 'Zusammenfassung fehlgeschlagen.' }, { status: 500 })
    }
}
