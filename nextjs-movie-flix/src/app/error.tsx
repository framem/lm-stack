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
        <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <h1 className="text-4xl font-bold text-white mb-4">
                    Ein Fehler ist aufgetreten
                </h1>
                <p className="text-zinc-400 mb-8">
                    Etwas ist schiefgelaufen. Bitte versuche es erneut.
                </p>
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors"
                >
                    Erneut versuchen
                </button>
            </div>
        </div>
    )
}
