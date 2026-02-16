import { NextRequest } from 'next/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getDocumentWithChunks, updateDocument } from '@/src/data-access/documents'

const summarySchema = z.object({
    summary: z
        .string()
        .describe(
            'Prägnante, strukturierte Zusammenfassung in 3-5 Absätzen mit Aufzählungspunkten für die wichtigsten Konzepte, auf Deutsch, in Markdown formatiert.'
        ),
})

// POST /api/documents/[id]/summary - Generate summary for a document
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

        const { output } = await generateText({
            model: getModel(),
            output: Output.object({ schema: summarySchema }),
            system: `Du bist ein Zusammenfassungs-Assistent. Erstelle eine prägnante, strukturierte Zusammenfassung des folgenden Lernmaterials in 3-5 Absätzen. Nutze Aufzählungspunkte für die wichtigsten Konzepte. Antworte auf Deutsch.`,
            prompt: `Fasse folgendes Lernmaterial zusammen:\n\n${context}`,
        })

        if (output?.summary) {
            await updateDocument(id, { summary: output.summary })
            return Response.json({ summary: output.summary })
        }

        return Response.json({ error: 'Zusammenfassung konnte nicht erstellt werden.' }, { status: 500 })
    } catch (error) {
        console.error('Summary generation error:', error)
        return Response.json({ error: 'Zusammenfassung fehlgeschlagen.' }, { status: 500 })
    }
}
