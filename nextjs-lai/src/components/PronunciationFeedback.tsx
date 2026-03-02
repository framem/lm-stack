'use client'

import { useMemo, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Volume2, RotateCcw } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import {
    comparePronunciation,
    getPronunciationTips,
    type WordComparison,
} from '@/src/lib/pronunciation-utils'

interface PronunciationFeedbackProps {
    expected: string
    recognized: string
    confidence: number   // 0-1 from speech recognition
    language: string     // BCP47 code for TTS
    onRetry: () => void
}

// Slow TTS playback for the correct pronunciation
function playSlowTTS(text: string, lang: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.6

    const voices = window.speechSynthesis.getVoices()
    const match = voices.find((v) => v.lang.startsWith(lang.split('-')[0]))
    if (match) utterance.voice = match

    window.speechSynthesis.speak(utterance)
}

// Color class for word match status
function statusColor(status: WordComparison['status']): string {
    switch (status) {
        case 'match': return 'text-green-600 dark:text-green-400'
        case 'partial': return 'text-orange-600 dark:text-orange-400'
        case 'mismatch': return 'text-red-600 dark:text-red-400'
        case 'missing': return 'text-red-600/50 dark:text-red-400/50'
        case 'extra': return 'text-muted-foreground line-through'
    }
}

function statusBg(status: WordComparison['status']): string {
    switch (status) {
        case 'match': return 'bg-green-100 dark:bg-green-950/30'
        case 'partial': return 'bg-orange-100 dark:bg-orange-950/30'
        case 'mismatch': return 'bg-red-100 dark:bg-red-950/30'
        case 'missing': return 'bg-red-50 dark:bg-red-950/20 border-dashed'
        case 'extra': return 'bg-muted/50'
    }
}

export function PronunciationFeedback({
    expected,
    recognized,
    confidence,
    language,
    onRetry,
}: PronunciationFeedbackProps) {
    const comparison = useMemo(
        () => comparePronunciation(expected, recognized),
        [expected, recognized]
    )

    const percentage = Math.round(confidence * 100)

    // Collect mismatched expected words for tips
    const mismatchedWords = useMemo(
        () => comparison
            .filter(c => c.status === 'mismatch' || c.status === 'partial')
            .map(c => c.expected)
            .filter(Boolean),
        [comparison]
    )

    const tips = useMemo(
        () => getPronunciationTips(mismatchedWords, language),
        [mismatchedWords, language]
    )

    const handleSlowPlay = useCallback(
        () => playSlowTTS(expected, language),
        [expected, language]
    )

    // Determine overall status icon
    const matchCount = comparison.filter(c => c.status === 'match').length
    const totalExpected = comparison.filter(c => c.expected).length
    const matchRatio = totalExpected > 0 ? matchCount / totalExpected : 0

    return (
        <Card>
            <CardContent className="space-y-5 pt-1">
                {/* Confidence meter */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Erkennungs-Konfidenz</span>
                        <span className="font-medium">{percentage}%</span>
                    </div>
                    <Progress
                        value={percentage}
                        className={`h-2.5 ${
                            confidence >= 0.8
                                ? '[&>[data-slot=progress-indicator]]:bg-green-500'
                                : confidence >= 0.6
                                    ? '[&>[data-slot=progress-indicator]]:bg-orange-500'
                                    : '[&>[data-slot=progress-indicator]]:bg-red-500'
                        }`}
                    />
                </div>

                {/* Word match summary */}
                <div className="flex items-center justify-center gap-2 text-sm">
                    {matchRatio >= 0.8 ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{matchCount} von {totalExpected} Wörtern richtig</span>
                        </div>
                    ) : matchRatio >= 0.5 ? (
                        <div className="flex items-center gap-1.5 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{matchCount} von {totalExpected} Wörtern richtig</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>{matchCount} von {totalExpected} Wörtern richtig</span>
                        </div>
                    )}
                </div>

                {/* Word-by-word comparison */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Wort-für-Wort Vergleich</p>
                    <div className="flex flex-wrap gap-2">
                        {comparison.map((c, i) => (
                            <div
                                key={i}
                                className={`rounded-md border px-2.5 py-1.5 text-center min-w-[3rem] ${statusBg(c.status)}`}
                            >
                                {c.expected && (
                                    <p className="text-xs text-muted-foreground leading-tight">
                                        {c.expected}
                                    </p>
                                )}
                                <p className={`text-sm font-medium leading-tight ${statusColor(c.status)}`}>
                                    {c.status === 'missing'
                                        ? '—'
                                        : c.recognized || '—'
                                    }
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-200 dark:bg-green-900" />
                            Richtig
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-200 dark:bg-orange-900" />
                            Teilweise
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-200 dark:bg-red-900" />
                            Falsch / Fehlt
                        </span>
                    </div>
                </div>

                {/* Pronunciation tips */}
                {tips.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Aussprachetipps</p>
                        {tips.map((t, i) => (
                            <div key={i} className="rounded-md border bg-muted/30 p-3 text-sm">
                                <Badge variant="outline" className="mb-1 font-mono">{t.word}</Badge>
                                <p className="text-muted-foreground">{t.tip}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={handleSlowPlay}
                    >
                        <Volume2 className="h-4 w-4" />
                        Langsam anhören
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={onRetry}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Nochmal versuchen
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
