import { generateText } from 'ai'
import { getModel } from '@/src/lib/llm'
import { updateDocument } from '@/src/data-access/documents'
import { prisma } from '@/src/lib/prisma'

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

    const { text } = await generateText({
        model: getModel(),
        system: `Du bist ein Zusammenfassungs-Assistent. Erstelle eine prägnante, strukturierte Zusammenfassung des folgenden Lernmaterials in 3-5 Absätzen. Nutze Aufzählungspunkte für die wichtigsten Konzepte. Antworte auf Deutsch.`,
        prompt: `Fasse folgendes Lernmaterial zusammen:\n\n${context}`,
    })

    if (text) {
        await updateDocument(documentId, { summary: text })
    }
}
