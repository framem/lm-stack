import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments } from '@/src/data-access/documents'
import { searchFlashcards } from '@/src/data-access/flashcards'
import { searchQuizzes } from '@/src/data-access/quiz'

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('q') ?? ''

    if (query.length < 2) {
        return NextResponse.json({ documents: [], flashcards: [], quizzes: [] })
    }

    const [rawDocuments, flashcards, quizzes] = await Promise.all([
        searchDocuments(query),
        searchFlashcards(query),
        searchQuizzes(query),
    ])

    const documents = rawDocuments.map((d) => ({
        id: d.id,
        title: d.title,
        fileName: d.fileName,
        subject: d.subject,
    }))

    return NextResponse.json({ documents, flashcards, quizzes })
}
