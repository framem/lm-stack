import { NextRequest, NextResponse } from 'next/server'
import { getQuizResults } from '@/src/data-access/quiz'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const quiz = await getQuizResults(id)

        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz nicht gefunden.' },
                { status: 404 }
            )
        }

        return NextResponse.json(quiz)
    } catch (error) {
        console.error('Quiz results fetch error:', error)
        return NextResponse.json(
            { error: 'Fehler beim Laden der Ergebnisse.' },
            { status: 500 }
        )
    }
}
