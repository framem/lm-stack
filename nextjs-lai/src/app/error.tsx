'use client'

import { useEffect, useMemo } from 'react'

// Rotating study-themed error messages
const errorMessages = [
    {
        title: 'Blackout!',
        subtitle: 'Selbst die KI braucht mal eine Lernpause.',
    },
    {
        title: 'Ups, Denkfehler!',
        subtitle: 'Das hat in der Probeklausur noch funktioniert...',
    },
    {
        title: 'Kurzer Systemausfall',
        subtitle: 'Keine Sorge, das kommt nicht in der Prüfung dran.',
    },
    {
        title: 'Da ging was schief!',
        subtitle: 'Die KI hat sich verrechnet – passiert den Besten.',
    },
    {
        title: 'Technische Störung',
        subtitle: 'Wie das WLAN in der Uni – unzuverlässig, aber wir arbeiten dran.',
    },
]

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

    const { title, subtitle } = useMemo(
        () => errorMessages[Math.floor(Math.random() * errorMessages.length)],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [error],
    )

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="text-5xl mb-4">🫠</div>
                <h1 className="text-4xl font-bold mb-2">
                    {title}
                </h1>
                <p className="text-muted-foreground mb-8">
                    {subtitle}
                </p>
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                    Nochmal versuchen
                </button>
            </div>
        </div>
    )
}
