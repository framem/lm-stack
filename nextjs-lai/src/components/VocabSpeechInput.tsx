'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/src/components/ui/button'
import { Mic, MicOff, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { normalizedLevenshtein } from '@/src/lib/string-similarity'

interface VocabSpeechInputProps {
    correctAnswer: string
    lang: string // BCP-47 language code
    onResult: (isCorrect: boolean, similarity: number) => void
}

const CORRECT_THRESHOLD = 0.8

export function VocabSpeechInput({ correctAnswer, lang, onResult }: VocabSpeechInputProps) {
    const [listening, setListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [similarity, setSimilarity] = useState(0)
    const [supported, setSupported] = useState(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null)

    const startListening = useCallback(() => {
        const SpeechRecognitionAPI = (window as Window).SpeechRecognition || (window as Window).webkitSpeechRecognition
        if (!SpeechRecognitionAPI) {
            setSupported(false)
            return
        }

        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = lang

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const result = event.results[0][0].transcript
            setTranscript(result)
            setListening(false)

            const sim = normalizedLevenshtein(result, correctAnswer)
            setSimilarity(sim)
            setSubmitted(true)
            onResult(sim >= CORRECT_THRESHOLD, sim)
        }

        recognition.onerror = () => {
            setListening(false)
        }

        recognition.onend = () => {
            setListening(false)
        }

        recognitionRef.current = recognition
        setTranscript('')
        setSubmitted(false)
        setListening(true)
        recognition.start()
    }, [correctAnswer, lang, onResult])

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop()
        setListening(false)
    }, [])

    if (!supported) {
        return (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20 p-4 text-center">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Dein Browser unterstützt keine Spracherkennung. Bitte verwende Chrome.
                </p>
            </div>
        )
    }

    const isCorrect = similarity >= CORRECT_THRESHOLD
    const isAlmost = similarity >= 0.6 && similarity < CORRECT_THRESHOLD

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
                <Button
                    size="lg"
                    variant={listening ? 'destructive' : 'default'}
                    className="h-20 w-20 rounded-full"
                    onClick={listening ? stopListening : startListening}
                    disabled={submitted}
                >
                    {listening ? (
                        <MicOff className="h-8 w-8" />
                    ) : (
                        <Mic className="h-8 w-8" />
                    )}
                </Button>
                <p className="text-sm text-muted-foreground">
                    {listening
                        ? 'Zuhören... Sprich jetzt!'
                        : submitted
                            ? ''
                            : 'Klicke auf das Mikrofon und sprich das Wort aus'}
                </p>
            </div>

            {transcript && (
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Erkannt:</p>
                    <p className="text-lg font-medium">{transcript}</p>
                </div>
            )}

            {submitted && (
                <div className="space-y-2 text-center">
                    {isCorrect ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Richtig!</span>
                        </div>
                    ) : isAlmost ? (
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2 text-yellow-600">
                                <AlertTriangle className="h-5 w-5" />
                                <span className="font-medium">Fast richtig!</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Korrekte Antwort: <span className="font-medium text-foreground">{correctAnswer}</span>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2 text-red-600">
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
