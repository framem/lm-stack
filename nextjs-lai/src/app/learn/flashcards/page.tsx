import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getFlashcards, getDueFlashcardCount } from '@/src/data-access/flashcards'
import { getDocuments } from '@/src/data-access/documents'
import { FlashcardsContent } from './flashcards-content'

async function FlashcardsData() {
    const [cardsRaw, docsRaw, dueCount] = await Promise.all([
        getFlashcards(),
        getDocuments(),
        getDueFlashcardCount(),
    ])

    const flashcards = cardsRaw.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        progress: c.progress
            ? {
                nextReviewAt: c.progress.nextReviewAt.toISOString(),
                lastReviewedAt: c.progress.lastReviewedAt?.toISOString() ?? null,
                easeFactor: c.progress.easeFactor,
                repetitions: c.progress.repetitions,
            }
            : null,
    }))

    const documents = docsRaw.map((d) => ({
        id: d.id,
        title: d.title,
        fileType: d.fileType,
        subject: d.subject,
    }))

    return (
        <FlashcardsContent
            initialFlashcards={flashcards}
            initialDocuments={documents}
            initialDueCount={dueCount}
        />
    )
}

export default function FlashcardsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <FlashcardsData />
        </Suspense>
    )
}
