'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <h1 className="text-4xl font-bold mb-4">
                    Ein Fehler ist aufgetreten
                </h1>
                <p className="text-muted-foreground mb-8">
                    Etwas ist schiefgelaufen. Bitte versuche es erneut.
                </p>
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                    Erneut versuchen
                </button>
            </div>
        </div>
    )
}
