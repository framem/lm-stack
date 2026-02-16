'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/src/components/ui/button'
import { Play, Square, Database, ArrowLeft, Zap, RotateCcw } from 'lucide-react'
import Link from 'next/link'

type EmbeddingStatus = {
    total: number
    embedded: number
    percentage: number
}

type EmbeddingMode = 'single' | 'batch'

export default function AdminPage() {
    const [status, setStatus] = useState<EmbeddingStatus | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [activeMode, setActiveMode] = useState<EmbeddingMode | null>(null)
    const [lastProcessed, setLastProcessed] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [elapsedMs, setElapsedMs] = useState<number | null>(null)
    const [isResetting, setIsResetting] = useState(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const startTimeRef = useRef<number | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        fetchStatus()
    }, [])

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    async function fetchStatus() {
        try {
            const res = await fetch('/api/admin/embeddings')
            const data = await res.json()
            setStatus(data)
        } catch {
            setError('Could not fetch embedding status')
        }
    }

    function startTimer() {
        startTimeRef.current = Date.now()
        setElapsedMs(0)
        timerRef.current = setInterval(() => {
            if (startTimeRef.current) {
                setElapsedMs(Date.now() - startTimeRef.current)
            }
        }, 100)
    }

    function stopTimer() {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        if (startTimeRef.current) {
            setElapsedMs(Date.now() - startTimeRef.current)
            startTimeRef.current = null
        }
    }

    function formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        const tenths = Math.floor((ms % 1000) / 100)
        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${tenths} min`
        }
        return `${seconds}.${tenths}s`
    }

    async function startEmbedding(mode: EmbeddingMode) {
        setIsRunning(true)
        setActiveMode(mode)
        setError(null)
        setElapsedMs(null)
        startTimer()

        const controller = new AbortController()
        abortControllerRef.current = controller

        const url = mode === 'batch'
            ? '/api/admin/embeddings/batch'
            : '/api/admin/embeddings'

        try {
            const res = await fetch(url, {
                method: 'POST',
                signal: controller.signal,
            })

            const reader = res.body!.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const events = buffer.split('\n\n')
                buffer = events.pop() || ''

                for (const event of events) {
                    const line = event.trim()
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6))
                        if (data.type === 'error') {
                            setError(data.message)
                            setIsRunning(false)
                            setActiveMode(null)
                            stopTimer()
                            return
                        }
                        setStatus({ total: data.total, embedded: data.embedded, percentage: data.percentage })
                        if (data.lastProcessed) setLastProcessed(data.lastProcessed)
                        if (data.type === 'done') {
                            setIsRunning(false)
                            setActiveMode(null)
                            stopTimer()
                        }
                    }
                }
            }
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                setError(`Embedding failed: ${(e as Error).message}`)
            }
        } finally {
            setIsRunning(false)
            setActiveMode(null)
            stopTimer()
            abortControllerRef.current = null
        }
    }

    function stopEmbedding() {
        abortControllerRef.current?.abort()
        setIsRunning(false)
        setActiveMode(null)
        stopTimer()
    }

    async function resetEmbeddings() {
        setIsResetting(true)
        setError(null)
        setLastProcessed(null)
        setElapsedMs(null)
        try {
            const res = await fetch('/api/admin/embeddings', { method: 'DELETE' })
            const data = await res.json()
            if (data.error) {
                setError(data.error)
            } else {
                setStatus(data)
            }
        } catch {
            setError('Reset fehlgeschlagen')
        } finally {
            setIsResetting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#141414] text-white">
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/" className="text-zinc-400 hover:text-white transition">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-6">
                {/* Embedding Card */}
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="w-5 h-5 text-red-500" />
                        <h2 className="text-lg font-semibold">Movie Embeddings</h2>
                    </div>

                    {status ? (
                        <>
                            {/* Progress Bar */}
                            <div className="mb-2">
                                <div className="flex justify-between text-sm text-zinc-400 mb-2">
                                    <span>{status.embedded} / {status.total} Movies</span>
                                    <span>{status.percentage}%</span>
                                </div>
                                <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-600 rounded-full transition-all duration-300"
                                        style={{ width: `${status.percentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Timer */}
                            {elapsedMs !== null && (
                                <div className="mt-3 flex items-center gap-2 text-sm">
                                    <span className="text-zinc-400">Dauer:</span>
                                    <span className={`font-mono ${isRunning ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {formatTime(elapsedMs)}
                                    </span>
                                    {activeMode && (
                                        <span className="text-zinc-500">
                                            ({activeMode === 'batch' ? 'Batch / embedMany' : 'Einzeln / embed'})
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Last Processed */}
                            {lastProcessed && (
                                <p className="text-sm text-zinc-400 mt-3">
                                    Zuletzt verarbeitet: <span className="text-zinc-200">{lastProcessed}</span>
                                </p>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-300 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                {!isRunning ? (
                                    <>
                                        <Button
                                            onClick={() => startEmbedding('single')}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                            disabled={status.percentage === 100 || isResetting}
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            {status.percentage === 100 ? 'Fertig' : 'Einzeln (embed)'}
                                        </Button>
                                        <Button
                                            onClick={() => startEmbedding('batch')}
                                            className="bg-amber-600 hover:bg-amber-700 text-white"
                                            disabled={status.percentage === 100 || isResetting}
                                        >
                                            <Zap className="w-4 h-4 mr-2" />
                                            {status.percentage === 100 ? 'Fertig' : 'Batch (embedMany)'}
                                        </Button>
                                        {status.embedded > 0 && (
                                            <Button
                                                onClick={resetEmbeddings}
                                                variant="outline"
                                                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                                                disabled={isResetting}
                                            >
                                                <RotateCcw className={`w-4 h-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
                                                {isResetting ? 'Wird zurückgesetzt...' : 'Reset'}
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <Button
                                        onClick={stopEmbedding}
                                        variant="outline"
                                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                                    >
                                        <Square className="w-4 h-4 mr-2" />
                                        Stop
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Loading state */
                        <div className="space-y-3">
                            <div className="h-3 bg-zinc-700 rounded animate-pulse" />
                            <div className="h-4 bg-zinc-700 rounded w-1/3 animate-pulse" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
