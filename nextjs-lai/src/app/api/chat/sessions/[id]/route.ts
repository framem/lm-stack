import { getSessionWithMessages } from '@/src/data-access/chat'

// Get a single session with all its messages
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const session = await getSessionWithMessages(id)

        if (!session) {
            return Response.json(
                { error: 'Sitzung nicht gefunden.' },
                { status: 404 }
            )
        }

        return Response.json(session)
    } catch (error) {
        console.error('Session GET error:', error)
        return Response.json(
            { error: 'Sitzung konnte nicht geladen werden.' },
            { status: 500 }
        )
    }
}
