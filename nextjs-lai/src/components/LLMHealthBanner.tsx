'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Client-side LLM health check banner with periodic polling.
 * Replaces the blocking server-side check in layout.tsx.
 */
export function LLMHealthBanner() {
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        let mounted = true
        let pollTimeout: NodeJS.Timeout

        async function checkHealth() {
            if (!mounted) return

            try {
                const res = await fetch('/api/health', {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000),
                })

                if (mounted) {
                    const data = await res.json()
                    setIsHealthy(data.healthy)
                    setIsChecking(false)
                }
            } catch (error) {
                if (mounted) {
                    setIsHealthy(false)
                    setIsChecking(false)
                }
            }

            // Poll every 30 seconds
            if (mounted) {
                pollTimeout = setTimeout(checkHealth, 30000)
            }
        }

        checkHealth()

        return () => {
            mounted = false
            if (pollTimeout) clearTimeout(pollTimeout)
        }
    }, [])

    // Don't show banner while checking on first load
    if (isChecking || isHealthy === null) {
        return null
    }

    // Only show banner if unhealthy
    if (isHealthy) {
        return null
    }

    return (
        <div className="flex items-center gap-2 border-b border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-sm text-orange-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
                KI-Server nicht erreichbar — Chat, Quiz-Generierung und Karteikarten-Erstellung benötigen Ollama oder LM Studio.
                <strong className="ml-1">Vokabel-Quizze, Karteikarten-Wiederholung und Statistiken funktionieren weiterhin.</strong>
            </span>
        </div>
    )
}
