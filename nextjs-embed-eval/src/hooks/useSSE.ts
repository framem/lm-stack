'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface SSEProgress {
    current: number
    total: number
    message: string
    elapsedMs?: number
    phase?: string
}

export interface SSEResult<T = unknown> {
    data: T | null
    progress: SSEProgress | null
    isRunning: boolean
    error: string | null
    start: (url: string) => void
    abort: () => void
}

/**
 * Hook for consuming Server-Sent Events with progress tracking.
 */
export function useSSE<T = unknown>(): SSEResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [progress, setProgress] = useState<SSEProgress | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const abort = useCallback(() => {
        abortRef.current?.abort()
        abortRef.current = null
        setIsRunning(false)
    }, [])

    const start = useCallback((url: string) => {
        abort()
        setData(null)
        setProgress(null)
        setError(null)
        setIsRunning(true)

        const controller = new AbortController()
        abortRef.current = controller

        fetch(url, { signal: controller.signal })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                }

                const reader = response.body?.getReader()
                if (!reader) throw new Error('No response body')

                const decoder = new TextDecoder()
                let buffer = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const parsed = JSON.parse(line.slice(6))
                                if (parsed.type === 'progress') {
                                    setProgress(parsed)
                                } else if (parsed.type === 'complete') {
                                    setData(parsed.data)
                                } else if (parsed.type === 'error') {
                                    setError(parsed.message)
                                }
                            } catch {
                                // Skip malformed JSON lines
                            }
                        }
                    }
                }

                setIsRunning(false)
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setError(err.message)
                    setIsRunning(false)
                }
            })
    }, [abort])

    // Abort SSE stream on component unmount
    useEffect(() => {
        return () => { abortRef.current?.abort() }
    }, [])

    return { data, progress, isRunning, error, start, abort }
}
