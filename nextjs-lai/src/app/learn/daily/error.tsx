'use client'

import { useEffect } from 'react'
import { RotateCcw, Clock } from 'lucide-react'

export default function DailyError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Daily practice error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
            <Clock className="h-10 w-10 text-muted-foreground" />
            <div>
                <h2 className="text-lg font-semibold">Fehler beim Laden der Tagesübung</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Bitte versuche es erneut.
                </p>
            </div>
            <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
                <RotateCcw className="h-4 w-4" />
                Erneut versuchen
            </button>
        </div>
    )
}
