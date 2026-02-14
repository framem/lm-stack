import { NextRequest } from 'next/server'
import { createSession, getSessions } from '@/src/data-access/chat'

// List all chat sessions
export async function GET() {
    try {
        const sessions = await getSessions()
        return Response.json(sessions)
    } catch (error) {
        console.error('Sessions GET error:', error)
        return Response.json(
            { error: 'Sitzungen konnten nicht geladen werden.' },
            { status: 500 }
        )
    }
}

// Create a new chat session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, documentId } = body as { title?: string; documentId?: string }

        const session = await createSession({ title, documentId })
        return Response.json(session, { status: 201 })
    } catch (error) {
        console.error('Sessions POST error:', error)
        return Response.json(
            { error: 'Sitzung konnte nicht erstellt werden.' },
            { status: 500 }
        )
    }
}
