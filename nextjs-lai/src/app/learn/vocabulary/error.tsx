'use client'

import { useEffect } from 'react'
import { RotateCcw, BookOpen } from 'lucide-react'

export default function VocabularyError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Vocabulary error:', error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <BookOpen className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Vokabeltrainer nicht verfügbar</h2>
                <p className="text-muted-foreground mb-6">
                    Beim Laden des Vokabeltrainers ist ein Fehler aufgetreten. Bitte versuche es erneut.
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                    <RotateCcw className="h-4 w-4" />
                    Nochmal versuchen
                </button>
            </div>
        </div>
    )
}
