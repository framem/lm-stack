import { NextRequest, NextResponse } from 'next/server'
import { getQuizWithQuestions, deleteQuiz } from '@/src/data-access/quiz'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const quiz = await getQuizWithQuestions(id)

        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz nicht gefunden.' },
                { status: 404 }
            )
        }

        // Strip correctIndex/correctAnswer from questions for cheat protection
        const sanitizedQuestions = quiz.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            options: q.options,
            questionIndex: q.questionIndex,
            questionType: q.questionType,
        }))

        return NextResponse.json({
            id: quiz.id,
            title: quiz.title,
            document: quiz.document,
            createdAt: quiz.createdAt,
            questions: sanitizedQuestions,
        })
    } catch (error) {
        console.error('Quiz fetch error:', error)
        return NextResponse.json(
            { error: 'Fehler beim Laden des Quiz.' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const quiz = await getQuizWithQuestions(id)
        if (!quiz) {
            return NextResponse.json(
                { error: 'Quiz nicht gefunden.' },
                { status: 404 }
            )
        }

        await deleteQuiz(id)

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('Quiz delete error:', error)
        return NextResponse.json(
            { error: 'Fehler beim Löschen des Quiz.' },
            { status: 500 }
        )
    }
}
