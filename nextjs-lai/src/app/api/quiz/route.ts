import { NextResponse } from 'next/server'
import { getQuizzes } from '@/src/data-access/quiz'

export async function GET() {
    try {
        const quizzes = await getQuizzes()
        return NextResponse.json(quizzes)
    } catch (error) {
        console.error('Failed to fetch quizzes:', error)
        return NextResponse.json(
            { error: 'Quizze konnten nicht geladen werden.' },
            { status: 500 }
        )
    }
}
