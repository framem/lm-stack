import { NextRequest } from 'next/server'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { extractAndSaveTopics } from '@/src/lib/topic-extraction'

// POST /api/documents/[id]/topics - Extract topics for a document
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

        const topics = await extractAndSaveTopics(id)

        return Response.json({ topics })
    } catch (error) {
        console.error('Topic extraction error:', error)
        return Response.json({ error: 'Themenextraktion fehlgeschlagen.' }, { status: 500 })
    }
}
