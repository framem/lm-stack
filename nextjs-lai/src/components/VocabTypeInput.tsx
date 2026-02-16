'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { normalizedLevenshtein } from '@/src/lib/string-similarity'

interface VocabTypeInputProps {
    correctAnswer: string
    onResult: (isCorrect: boolean, similarity: number) => void
}

export function VocabTypeInput({ correctAnswer, onResult }: VocabTypeInputProps) {
    const [input, setInput] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [similarity, setSimilarity] = useState(0)

    const handleSubmit = useCallback(() => {
        if (!input.trim() || submitted) return
        const sim = normalizedLevenshtein(input, correctAnswer)
        setSimilarity(sim)
        setSubmitted(true)
        onResult(sim >= 0.95, sim)
    }, [input, submitted, correctAnswer, onResult])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        }
    }, [handleSubmit])

    const isCorrect = similarity >= 0.95
    const isAlmostCorrect = similarity >= 0.8 && similarity < 0.95

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Antwort eingeben..."
                    disabled={submitted}
                    autoFocus
                    className={submitted ? (
                        isCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                            : isAlmostCorrect
                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30'
                                : 'border-red-500 bg-red-50 dark:bg-red-950/30'
                    ) : ''}
                />
                {!submitted && (
                    <Button onClick={handleSubmit} disabled={!input.trim()}>
                        Prüfen
                    </Button>
                )}
            </div>

            {submitted && (
                <div className="space-y-2">
                    {isCorrect ? (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Richtig!</span>
                        </div>
                    ) : isAlmostCorrect ? (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-yellow-600">
                                <AlertTriangle className="h-5 w-5" />
                                <span className="font-medium">Fast richtig!</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Korrekte Antwort: <span className="font-medium text-foreground">{correctAnswer}</span>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-red-600">
                                <XCircle className="h-5 w-5" />
                                <span className="font-medium">Nicht richtig</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Korrekte Antwort: <span className="font-medium text-foreground">{correctAnswer}</span>
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
