'use client'

import { Progress } from '@/src/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import type { SSEProgress } from '@/src/hooks/useSSE'

interface EmbedProgressProps {
    progress: SSEProgress | null
    isRunning: boolean
    error: string | null
    result: { chunkSize?: number; chunkOverlap?: number; totalChunks?: number; modelsProcessed?: number; chunksEmbedded?: number; phrasesEmbedded?: number; totalDurationMs?: number } | null
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms} ms`
    const seconds = ms / 1000
    if (seconds < 60) return `${seconds.toFixed(1)} s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes} min ${remainingSeconds} s`
}

export function EmbedProgress({ progress, isRunning, error, result }: EmbedProgressProps) {
    if (!isRunning && !error && !result) return null

    const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!isRunning && !error && result && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {error && <AlertCircle className="h-4 w-4 text-destructive" />}
                    Embedding-Fortschritt
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {isRunning && progress && (
                    <>
                        {progress.phase && (
                            <p className="text-sm font-medium">{progress.phase}</p>
                        )}
                        <Progress value={percentage} />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{progress.message} ({percentage}%)</span>
                            {progress.elapsedMs != null && (
                                <span>{formatDuration(progress.elapsedMs)}</span>
                            )}
                        </div>
                    </>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!isRunning && result && (
                    <div className="text-sm space-y-1">
                        {result.chunkSize != null && (
                            <p>Chunking: {result.chunkSize} Tokens / {result.chunkOverlap} Overlap → {result.totalChunks} Chunks</p>
                        )}
                        {result.modelsProcessed != null && (
                            <p>{result.modelsProcessed} Modelle verarbeitet</p>
                        )}
                        <p>{result.chunksEmbedded} Chunks eingebettet</p>
                        <p>{result.phrasesEmbedded} Phrasen eingebettet</p>
                        {result.totalDurationMs != null && (
                            <p className="font-medium">Gesamtdauer: {formatDuration(result.totalDurationMs)}</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
