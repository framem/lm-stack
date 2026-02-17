'use client'

import { useEffect } from 'react'
import { RotateCcw, GraduationCap } from 'lucide-react'

export default function SessionError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Session error:', error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="text-center max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <GraduationCap className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Lern-Session nicht verfügbar</h2>
                <p className="text-muted-foreground mb-6">
                    Die Lern-Session konnte nicht geladen werden. Bitte versuche es erneut.
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
