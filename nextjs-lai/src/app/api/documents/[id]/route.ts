import { NextRequest, NextResponse } from 'next/server'
import { getDocumentWithChunks, deleteDocument } from '@/src/data-access/documents'

// GET /api/documents/[id] - Get document with its chunks
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const document = await getDocumentWithChunks(id)

        if (!document) {
            return NextResponse.json(
                { error: 'Dokument nicht gefunden.' },
                { status: 404 }
            )
        }

        return NextResponse.json(document)
    } catch (error) {
        console.error('Failed to fetch document:', error)
        return NextResponse.json(
            { error: 'Dokument konnte nicht geladen werden.' },
            { status: 500 }
        )
    }
}

// DELETE /api/documents/[id] - Delete document and cascade to chunks
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const document = await getDocumentWithChunks(id)

        if (!document) {
            return NextResponse.json(
                { error: 'Dokument nicht gefunden.' },
                { status: 404 }
            )
        }

        await deleteDocument(id)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete document:', error)
        return NextResponse.json(
            { error: 'Dokument konnte nicht gelöscht werden.' },
            { status: 500 }
        )
    }
}
