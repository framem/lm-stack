import { NextRequest, NextResponse } from 'next/server'
import { searchDocuments, findSimilarChunks } from '@/src/data-access/documents'
import { searchFlashcards } from '@/src/data-access/flashcards'
import { searchQuizzes } from '@/src/data-access/quiz'
import { createEmbedding } from '@/src/lib/llm'

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('q') ?? ''

    if (query.length < 2) {
        return NextResponse.json({ documents: [], flashcards: [], quizzes: [], chunks: [] })
    }

    // Run semantic embedding and all keyword searches in parallel
    const semanticSearch = createEmbedding(query)
        .then((embedding) => findSimilarChunks(embedding, { topK: 4, threshold: 0.5 }))
        .catch(() => [])

    const [rawDocuments, flashcards, quizzes, rawChunks] = await Promise.all([
        searchDocuments(query),
        searchFlashcards(query),
        searchQuizzes(query),
        semanticSearch,
    ])

    const documents = rawDocuments.map((d) => ({
        id: d.id,
        title: d.title,
        fileName: d.fileName,
        subject: d.subject,
    }))

    const chunks = rawChunks.map((c) => ({
        id: c.id,
        documentId: c.documentId,
        documentTitle: c.documentTitle,
        content: c.content,
        similarity: c.similarity,
    }))

    return NextResponse.json({ documents, flashcards, quizzes, chunks })
}
