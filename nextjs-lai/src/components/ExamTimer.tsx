'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface ExamTimerProps {
    /** Time limit in minutes */
    timeLimit: number
    onTimeUp: () => void
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

export function ExamTimer({ timeLimit, onTimeUp }: ExamTimerProps) {
    const totalSeconds = timeLimit * 60
    const [remaining, setRemaining] = useState(totalSeconds)
    const isWarning = remaining <= totalSeconds * 0.2
    const isExpired = remaining <= 0

    const handleTimeUp = useCallback(() => onTimeUp(), [onTimeUp])

    useEffect(() => {
        if (isExpired) {
            handleTimeUp()
            return
        }

        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [isExpired, handleTimeUp])

    return (
        <div
            className={`sticky top-0 z-10 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium border-b transition-colors ${
                isExpired
                    ? 'bg-destructive text-destructive-foreground'
                    : isWarning
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
                      : 'bg-background/95 backdrop-blur text-muted-foreground'
            }`}
        >
            {isWarning && !isExpired && <AlertTriangle className="h-4 w-4" />}
            <Clock className="h-4 w-4" />
            <span>{isExpired ? 'Zeit abgelaufen!' : formatTime(remaining)}</span>
        </div>
    )
}
