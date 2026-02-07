'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Square, Database, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type EmbeddingStatus = {
    total: number
    embedded: number
    percentage: number
}

export default function AdminPage() {
    const [status, setStatus] = useState<EmbeddingStatus | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [lastProcessed, setLastProcessed] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    useEffect(() => {
        fetchStatus()
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

    async function startEmbedding() {
        setIsRunning(true)
        setError(null)
        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
            const res = await fetch('/api/admin/embeddings', {
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
                            return
                        }
                        setStatus({ total: data.total, embedded: data.embedded, percentage: data.percentage })
                        if (data.lastProcessed) setLastProcessed(data.lastProcessed)
                        if (data.type === 'done') setIsRunning(false)
                    }
                }
            }
        } catch (e) {
            if ((e as Error).name !== 'AbortError') {
                setError(`Embedding failed: ${(e as Error).message}`)
            }
        } finally {
            setIsRunning(false)
            abortControllerRef.current = null
        }
    }

    function stopEmbedding() {
        abortControllerRef.current?.abort()
        setIsRunning(false)
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

                            {/* Last Processed */}
                            {lastProcessed && (
                                <p className="text-sm text-zinc-400 mt-3">
                                    Last processed: <span className="text-zinc-200">{lastProcessed}</span>
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
                                    <Button
                                        onClick={startEmbedding}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        disabled={status.percentage === 100}
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        {status.percentage === 100 ? 'All Done' : 'Start Embedding'}
                                    </Button>
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
