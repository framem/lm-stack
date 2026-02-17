'use client'

import { useEffect } from 'react'
import { RotateCcw, HelpCircle } from 'lucide-react'

export default function QuizError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Quiz error:', error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <HelpCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Quiz konnte nicht geladen werden</h2>
                <p className="text-muted-foreground mb-6">
                    Beim Laden des Quiz ist ein Fehler aufgetreten. Möglicherweise ist der LLM-Server nicht erreichbar.
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
