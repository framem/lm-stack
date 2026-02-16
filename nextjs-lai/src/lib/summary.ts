import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { updateDocument } from '@/src/data-access/documents'
import { prisma } from '@/src/lib/prisma'

const summarySchema = z.object({
    summary: z
        .string()
        .describe(
            'Prägnante, strukturierte Zusammenfassung in 3-5 Absätzen mit Aufzählungspunkten für die wichtigsten Konzepte, auf Deutsch, in Markdown formatiert.'
        ),
})

// Generate a summary for a document and save it to DB (non-streaming)
export async function generateAndSaveSummary(documentId: string) {
    const chunks = await prisma.documentChunk.findMany({
        where: { documentId },
        orderBy: { chunkIndex: 'asc' },
        take: 10,
        select: { content: true },
    })

    if (chunks.length === 0) return

    const context = chunks.map((c) => c.content).join('\n\n')

    const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema: summarySchema }),
        system: `Du bist ein Zusammenfassungs-Assistent. Erstelle eine prägnante, strukturierte Zusammenfassung des folgenden Lernmaterials in 3-5 Absätzen. Nutze Aufzählungspunkte für die wichtigsten Konzepte. Antworte auf Deutsch.`,
        prompt: `Fasse folgendes Lernmaterial zusammen:\n\n${context}`,
    })

    if (output?.summary) {
        await updateDocument(documentId, { summary: output.summary })
    }
}
