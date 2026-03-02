'use client'

import { useEffect, useRef } from 'react'
import {
    startLearningSession,
    heartbeatLearningSession,
    endLearningSession,
} from '@/src/actions/learning-sessions'
import type { ActivityType } from '@/src/data-access/learning-sessions'

const HEARTBEAT_INTERVAL = 30_000 // 30 seconds

// Tracks learning time by starting a session on mount, sending heartbeats,
// and ending the session on unmount or when the tab becomes hidden.
export function useLearningSession(activityType: ActivityType) {
    const sessionIdRef = useRef<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        let mounted = true

        async function start() {
            try {
                const id = await startLearningSession(activityType)
                if (!mounted) {
                    // Component unmounted before session started — end immediately
                    endLearningSession(id)
                    return
                }
                sessionIdRef.current = id

                // Start heartbeat
                intervalRef.current = setInterval(() => {
                    if (sessionIdRef.current) {
                        heartbeatLearningSession(sessionIdRef.current).catch(() => {})
                    }
                }, HEARTBEAT_INTERVAL)
            } catch {
                // Silently ignore — time tracking is non-critical
            }
        }

        start()

        // End session on visibility change (tab hidden)
        function handleVisibility() {
            if (document.hidden && sessionIdRef.current) {
                endLearningSession(sessionIdRef.current).catch(() => {})
                if (intervalRef.current) clearInterval(intervalRef.current)
                sessionIdRef.current = null
            } else if (!document.hidden && !sessionIdRef.current) {
                start()
            }
        }

        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            mounted = false
            document.removeEventListener('visibilitychange', handleVisibility)
            if (intervalRef.current) clearInterval(intervalRef.current)
            if (sessionIdRef.current) {
                endLearningSession(sessionIdRef.current).catch(() => {})
                sessionIdRef.current = null
            }
        }
    }, [activityType])
}
