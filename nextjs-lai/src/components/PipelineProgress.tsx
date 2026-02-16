'use client'

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'

export interface PipelineStep {
    key: string
    label: string
    status: 'pending' | 'running' | 'completed' | 'error'
    detail?: string
    durationMs?: number
}

function formatDuration(ms: number): string {
    if (ms < 1000) return '< 1s'
    const s = ms / 1000
    if (s < 60) return `${s.toFixed(1)}s`
    const m = Math.floor(s / 60)
    const rem = Math.round(s % 60)
    return `${m}m ${rem}s`
}

function StatusIcon({ status }: { status: PipelineStep['status'] }) {
    switch (status) {
        case 'pending':
            return <Circle className="h-4 w-4 text-muted-foreground/40" />
        case 'running':
            return <Loader2 className="h-4 w-4 text-primary animate-spin" />
        case 'completed':
            return <CheckCircle2 className="h-4 w-4 text-green-500" />
        case 'error':
            return <XCircle className="h-4 w-4 text-destructive" />
    }
}

export function PipelineProgress({ steps }: { steps: PipelineStep[] }) {
    return (
        <div className="space-y-1.5">
            {steps.map((step) => (
                <div key={step.key} className="flex items-center gap-2.5 text-sm h-6">
                    <StatusIcon status={step.status} />
                    <span className={step.status === 'pending' ? 'text-muted-foreground' : ''}>
                        {step.label}
                    </span>
                    {step.status === 'running' && step.detail && (
                        <span className="text-xs text-muted-foreground ml-auto">
                            {step.detail}
                        </span>
                    )}
                    {step.status === 'completed' && step.durationMs != null && (
                        <span className="text-xs text-muted-foreground tabular-nums ml-auto">
                            {formatDuration(step.durationMs)}
                        </span>
                    )}
                </div>
            ))}
        </div>
    )
}

/** Create an initial set of pending pipeline steps. */
export function createSteps(defs: { key: string; label: string }[]): PipelineStep[] {
    return defs.map(d => ({ key: d.key, label: d.label, status: 'pending' }))
}

/** Advance pipeline to the target step key. Completes the previously running step. */
export function advanceStep(
    steps: PipelineStep[],
    targetKey: string,
    detail: string | undefined,
    startTimes: Record<string, number>,
): PipelineStep[] {
    const now = Date.now()
    return steps.map(s => {
        if (s.key === targetKey) {
            if (s.status === 'running') return { ...s, detail }
            startTimes[targetKey] = now
            return { ...s, status: 'running', detail }
        }
        if (s.status === 'running') {
            const started = startTimes[s.key]
            return { ...s, status: 'completed', detail: undefined, durationMs: started ? now - started : undefined }
        }
        return s
    })
}

/** Mark all running steps as completed. */
export function completeSteps(
    steps: PipelineStep[],
    startTimes: Record<string, number>,
): PipelineStep[] {
    const now = Date.now()
    return steps.map(s => {
        if (s.status === 'running') {
            const started = startTimes[s.key]
            return { ...s, status: 'completed', detail: undefined, durationMs: started ? now - started : undefined }
        }
        return s
    })
}
