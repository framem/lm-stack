import { NextRequest } from 'next/server'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { generateAndSaveToc } from '@/src/lib/toc-extraction'

// POST /api/documents/[id]/toc - Generate table of contents for a document
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

        const sections = await generateAndSaveToc(id)

        if (sections && sections.length > 0) {
            return Response.json({ tableOfContents: sections })
        }

        return Response.json({ error: 'Kein Inhaltsverzeichnis erkannt.' }, { status: 500 })
    } catch (error) {
        console.error('TOC generation error:', error)
        return Response.json({ error: 'Inhaltsverzeichnis-Erstellung fehlgeschlagen.' }, { status: 500 })
    }
}
