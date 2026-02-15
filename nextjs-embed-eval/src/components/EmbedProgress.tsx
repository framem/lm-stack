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
    result: { chunksEmbedded?: number; phrasesEmbedded?: number } | null
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
                        <Progress value={percentage} />
                        <p className="text-sm text-muted-foreground">
                            {progress.message} ({percentage}%)
                        </p>
                    </>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!isRunning && result && (
                    <div className="text-sm space-y-1">
                        <p>{result.chunksEmbedded} Chunks eingebettet</p>
                        <p>{result.phrasesEmbedded} Phrasen eingebettet</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
