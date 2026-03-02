'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Mic,
    MicOff,
    Check,
    X,
    RotateCcw,
    Volume2,
    BookOpen,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { TTSButton } from '@/src/components/TTSButton'
import { useLearningSession } from '@/src/hooks/use-learning-session'
import { normalizedLevenshtein } from '@/src/lib/string-similarity'
import type { LanguageInfo } from '@/src/lib/language-utils'
import {
    getPronunciationExercises,
    getPhonemeGuides,
    getPhonemeLabel,
    type PronunciationExercise,
    type PhonemeGuide,
} from './pronunciation-data'
import { shuffle } from '@/src/lib/utils'

const CORRECT_THRESHOLD = 0.8
const ALMOST_THRESHOLD = 0.6

/** Speak a short text snippet via Web Speech API */
function speakText(text: string, lang: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.85
    const voices = window.speechSynthesis.getVoices()
    const match = voices.find((v) => v.lang.startsWith(lang.split('-')[0]))
    if (match) utterance.voice = match
    window.speechSynthesis.speak(utterance)
}

// ── Phonetic Comparison Display ────────────────────────────────────────
// Character-level diff: highlights matching/mismatching segments

function PhoneticComparison({
    expected,
    received,
    similarity,
}: {
    expected: string
    received: string
    similarity: number
}) {
    // Compute character-level alignment for visual feedback
    const expectedChars = expected.toLowerCase().split('')
    const receivedChars = received.toLowerCase().split('')

    // Build character-level match array using simple alignment
    const maxLen = Math.max(expectedChars.length, receivedChars.length)
    const charResults: Array<{ char: string; status: 'correct' | 'wrong' | 'missing' }> = []

    for (let i = 0; i < maxLen; i++) {
        const exp = expectedChars[i]
        const rec = receivedChars[i]
        if (exp && rec && exp === rec) {
            charResults.push({ char: rec, status: 'correct' })
        } else if (rec) {
            charResults.push({ char: rec, status: 'wrong' })
        } else {
            charResults.push({ char: exp || '', status: 'missing' })
        }
    }

    const percentage = Math.round(similarity * 100)

    return (
        <div className="space-y-3">
            {/* Confidence bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Übereinstimmung</span>
                    <span className="font-medium">{percentage}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${
                            similarity >= CORRECT_THRESHOLD
                                ? 'bg-green-500'
                                : similarity >= ALMOST_THRESHOLD
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {/* Character comparison */}
            <div className="space-y-2">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Erwartet:</p>
                    <p className="text-lg font-mono tracking-wider">{expected}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Erkannt:</p>
                    <p className="text-lg font-mono tracking-wider">
                        {charResults.map((cr, i) => (
                            <span
                                key={i}
                                className={
                                    cr.status === 'correct'
                                        ? 'text-green-600 dark:text-green-400'
                                        : cr.status === 'wrong'
                                            ? 'text-red-600 dark:text-red-400 underline decoration-wavy decoration-red-400'
                                            : 'text-muted-foreground/40'
                                }
                            >
                                {cr.char || '_'}
                            </span>
                        ))}
                    </p>
                </div>
            </div>
        </div>
    )
}

// ── Confidence Gauge ───────────────────────────────────────────────────

function ConfidenceGauge({ confidence }: { confidence: number }) {
    const percentage = Math.round(confidence * 100)
    const radius = 40
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (confidence * circumference)

    const color = confidence >= CORRECT_THRESHOLD
        ? 'text-green-500'
        : confidence >= ALMOST_THRESHOLD
            ? 'text-yellow-500'
            : 'text-red-500'

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                />
                <circle
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`${color} transition-all duration-700`}
                />
            </svg>
            <span className={`text-xl font-bold -mt-16 ${color}`}>{percentage}%</span>
            <span className="text-xs text-muted-foreground mt-8">Genauigkeit</span>
        </div>
    )
}

// ── Speech Recording Component ─────────────────────────────────────────

function SpeechRecorder({
    lang,
    onResult,
    disabled,
}: {
    lang: string
    onResult: (transcript: string, confidence: number) => void
    disabled: boolean
}) {
    const [listening, setListening] = useState(false)
    const [supported, setSupported] = useState(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null)

    const startListening = useCallback(() => {
        const SpeechRecognitionAPI =
            (window as Window).SpeechRecognition || (window as Window).webkitSpeechRecognition
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
            const result = event.results[0][0]
            const transcript: string = result.transcript
            const confidence: number = result.confidence ?? 0.5
            setListening(false)
            onResult(transcript, confidence)
        }

        recognition.onerror = () => setListening(false)
        recognition.onend = () => setListening(false)

        recognitionRef.current = recognition
        setListening(true)
        recognition.start()
    }, [lang, onResult])

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop()
        setListening(false)
    }, [])

    // Clean up speech recognition on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.abort()
        }
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

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative">
                {/* Animated pulse rings when recording */}
                {listening && [0, 1, 2].map((index) => (
                    <div
                        key={index}
                        className="absolute inset-0 animate-ping rounded-full border-2 border-red-400/30"
                        style={{
                            animationDelay: `${index * 0.3}s`,
                            animationDuration: '2s',
                        }}
                    />
                ))}
                <Button
                    size="lg"
                    variant={listening ? 'destructive' : 'default'}
                    className="h-20 w-20 rounded-full relative z-10"
                    onClick={listening ? stopListening : startListening}
                    disabled={disabled}
                >
                    {listening ? (
                        <MicOff className="h-8 w-8" />
                    ) : (
                        <Mic className="h-8 w-8" />
                    )}
                </Button>
            </div>
            <p className="text-sm text-muted-foreground">
                {listening
                    ? 'Zuhören... Sprich jetzt!'
                    : disabled
                        ? ''
                        : 'Klicke auf das Mikrofon und sprich das Wort aus'
                }
            </p>
        </div>
    )
}

// ── Practice Drill ─────────────────────────────────────────────────────

function PracticeDrill({
    exercises,
    bcp47,
}: {
    exercises: PronunciationExercise[]
    bcp47: string
}) {
    const shuffled = useMemo(() => shuffle(exercises), [exercises])
    const [current, setCurrent] = useState(0)
    const [transcript, setTranscript] = useState('')
    const [confidence, setConfidence] = useState(0)
    const [similarity, setSimilarity] = useState(0)
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)
    const [attempts, setAttempts] = useState(0)
    const [finished, setFinished] = useState(false)
    const [showTip, setShowTip] = useState(false)

    const exercise = shuffled[current]
    const total = shuffled.length

    const handleSpeechResult = useCallback((text: string, conf: number) => {
        setTranscript(text)
        setConfidence(conf)
        const sim = normalizedLevenshtein(text, exercise.word)
        setSimilarity(sim)
        setSubmitted(true)
        setAttempts(a => a + 1)
        if (sim >= CORRECT_THRESHOLD) {
            setScore(s => s + 1)
        }
    }, [exercise])

    const handleRetry = useCallback(() => {
        setTranscript('')
        setConfidence(0)
        setSimilarity(0)
        setSubmitted(false)
        setShowTip(false)
    }, [])

    const handleNext = useCallback(() => {
        if (current + 1 >= total) {
            setFinished(true)
        } else {
            setCurrent(c => c + 1)
            setTranscript('')
            setConfidence(0)
            setSimilarity(0)
            setSubmitted(false)
            setShowTip(false)
        }
    }, [current, total])

    const handleRestart = useCallback(() => {
        setCurrent(0)
        setTranscript('')
        setConfidence(0)
        setSimilarity(0)
        setSubmitted(false)
        setScore(0)
        setAttempts(0)
        setFinished(false)
        setShowTip(false)
    }, [])

    if (exercises.length === 0) {
        return (
            <Card>
                <CardContent>
                    <p className="text-muted-foreground py-4">
                        Keine Ausspracheübungen für diese Sprache verfügbar.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (finished) {
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0
        const getMessage = () => {
            if (percentage === 100) return 'Perfekt! Deine Aussprache ist ausgezeichnet!'
            if (percentage >= 80) return 'Großartig! Du sprichst sehr gut!'
            if (percentage >= 60) return 'Gut gemacht! Weiter so!'
            if (percentage >= 40) return 'Nicht schlecht. Übe die schwierigen Laute weiter!'
            return 'Weiter üben — regelmäßiges Sprechen ist der Schlüssel!'
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Ergebnis: Aussprache</CardTitle>
                    <CardDescription>{getMessage()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center space-y-2">
                        <p className="text-4xl font-bold">{score} / {total}</p>
                        <p className="text-muted-foreground">{percentage}% beim ersten Versuch richtig</p>
                        <p className="text-sm text-muted-foreground">{attempts} Versuche insgesamt</p>
                        <Progress value={percentage} className="h-3" />
                    </div>
                    <Button onClick={handleRestart} variant="outline" className="w-full gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Nochmal üben
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const isCorrect = submitted && similarity >= CORRECT_THRESHOLD
    const isAlmost = submitted && similarity >= ALMOST_THRESHOLD && similarity < CORRECT_THRESHOLD

    return (
        <div className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Übung {current + 1} von {total}</span>
                    <span>Punkte: {score} / {total}</span>
                </div>
                <Progress value={(current / total) * 100} />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Volume2 className="h-5 w-5 text-primary" />
                                Sprich das Wort aus
                            </CardTitle>
                            <CardDescription>
                                <Badge variant="outline" className="mr-2">
                                    {exercise.difficulty === 'easy' ? 'Leicht' : exercise.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
                                </Badge>
                                {exercise.translation}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Target word with IPA and TTS */}
                    <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                            <p className="text-3xl font-bold">{exercise.word}</p>
                            <TTSButton text={exercise.word} lang={bcp47} size="default" />
                        </div>
                        <p className="text-lg text-muted-foreground font-mono">{exercise.ipa}</p>
                    </div>

                    {/* Focused phonemes */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Fokus-Laute:</span>
                        {exercise.phonemesFocus.map((p, i) => {
                            const label = getPhonemeLabel(p, exercise.language)
                            return (
                                <Badge
                                    key={i}
                                    variant="secondary"
                                    className={`text-sm gap-1.5 ${label.example ? 'cursor-pointer hover:bg-accent transition-colors' : ''}`}
                                    onClick={label.example ? () => speakText(label.example!, bcp47) : undefined}
                                >
                                    {label.example && <Volume2 className="h-3 w-3 text-muted-foreground" />}
                                    <span className="font-semibold">{label.letter}</span>
                                    <span className="font-mono text-muted-foreground">/{label.ipa}/</span>
                                </Badge>
                            )
                        })}
                    </div>

                    {/* Speech recorder */}
                    <SpeechRecorder
                        lang={bcp47}
                        onResult={handleSpeechResult}
                        disabled={submitted}
                    />

                    {/* Results */}
                    {submitted && (
                        <div className="space-y-4">
                            {/* Status icon */}
                            <div className="flex items-center justify-center gap-2">
                                {isCorrect ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <Check className="h-5 w-5" />
                                        <span className="font-medium">Sehr gut!</span>
                                    </div>
                                ) : isAlmost ? (
                                    <div className="flex items-center gap-2 text-yellow-600">
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="font-medium">Fast richtig!</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <X className="h-5 w-5" />
                                        <span className="font-medium">Versuch es nochmal</span>
                                    </div>
                                )}
                            </div>

                            {/* Confidence gauge + phonetic comparison side by side */}
                            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-start">
                                <div className="flex justify-center">
                                    <ConfidenceGauge confidence={similarity} />
                                </div>
                                <PhoneticComparison
                                    expected={exercise.word}
                                    received={transcript}
                                    similarity={similarity}
                                />
                            </div>

                            {/* Browser confidence */}
                            {confidence > 0 && (
                                <p className="text-xs text-center text-muted-foreground">
                                    Erkennungs-Konfidenz: {Math.round(confidence * 100)}%
                                </p>
                            )}

                            {/* Pronunciation tip (collapsible) */}
                            <button
                                type="button"
                                onClick={() => setShowTip(t => !t)}
                                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                            >
                                {showTip ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                Aussprachetipp anzeigen
                            </button>
                            {showTip && (
                                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                    {exercise.tip}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                {!isCorrect && (
                                    <Button onClick={handleRetry} variant="outline" className="flex-1 gap-2">
                                        <RotateCcw className="h-4 w-4" />
                                        Nochmal versuchen
                                    </Button>
                                )}
                                <Button onClick={handleNext} className="flex-1">
                                    {current + 1 >= total ? 'Ergebnis anzeigen' : 'Nächste Übung'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// ── Phoneme Guide Panel ────────────────────────────────────────────────

function PhonemeGuidePanel({ guides }: { guides: PhonemeGuide[] }) {
    const [expanded, setExpanded] = useState<number | null>(null)

    if (guides.length === 0) {
        return (
            <Card>
                <CardContent>
                    <p className="text-muted-foreground py-4">
                        Keine Lautführungen für diese Sprache verfügbar.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
                Klicke auf einen Laut, um Tipps und Erklärungen zu sehen.
            </p>
            {guides.map((guide, idx) => (
                <Card key={idx} className="overflow-hidden">
                    <button
                        type="button"
                        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        onClick={() => setExpanded(expanded === idx ? null : idx)}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-mono font-bold text-primary w-12 text-center">
                                {guide.symbol}
                            </span>
                            <div>
                                <p className="font-medium">{guide.phoneme}</p>
                                <p className="text-xs text-muted-foreground">{guide.exampleWord}</p>
                            </div>
                        </div>
                        {expanded === idx
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        }
                    </button>
                    {expanded === idx && (
                        <CardContent className="border-t space-y-3">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Beschreibung</p>
                                <p className="text-sm">{guide.description}</p>
                            </div>
                            <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
                                <p className="text-xs font-semibold text-primary mb-1">Tipp</p>
                                <p className="text-sm">{guide.tip}</p>
                            </div>
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    )
}

// ── Difficult Sounds Practice ──────────────────────────────────────────

function DifficultSoundsPractice({
    exercises,
    bcp47,
    languageCode,
}: {
    exercises: PronunciationExercise[]
    bcp47: string
    languageCode: string
}) {
    // Filter to only hard/medium exercises
    const difficultExercises = useMemo(
        () => exercises.filter(e => e.difficulty === 'hard' || e.difficulty === 'medium'),
        [exercises]
    )
    const [selectedPhoneme, setSelectedPhoneme] = useState<string | null>(null)

    // Get unique phonemes from difficult exercises
    const phonemes = useMemo(() => {
        const set = new Set<string>()
        difficultExercises.forEach(e => e.phonemesFocus.forEach(p => set.add(p)))
        return Array.from(set)
    }, [difficultExercises])

    // Filter exercises by selected phoneme
    const filtered = useMemo(() => {
        if (!selectedPhoneme) return difficultExercises
        return difficultExercises.filter(e => e.phonemesFocus.includes(selectedPhoneme))
    }, [difficultExercises, selectedPhoneme])

    if (difficultExercises.length === 0) {
        return (
            <Card>
                <CardContent>
                    <p className="text-muted-foreground py-4">
                        Keine schwierigen Laute zum Üben verfügbar.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Wähle einen schwierigen Laut und übe gezielt Wörter mit diesem Laut.
            </p>

            {/* Phoneme selector */}
            <div className="flex flex-wrap gap-2">
                <Badge
                    variant={selectedPhoneme === null ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-1 px-3"
                    onClick={() => setSelectedPhoneme(null)}
                >
                    Alle
                </Badge>
                {phonemes.map(p => {
                    const label = getPhonemeLabel(p, languageCode)
                    return (
                        <Badge
                            key={p}
                            variant={selectedPhoneme === p ? 'default' : 'outline'}
                            className="cursor-pointer text-sm py-1 px-3 gap-1.5"
                            onClick={() => setSelectedPhoneme(p)}
                        >
                            {label.example && (
                                <button
                                    type="button"
                                    className="hover:text-primary transition-colors"
                                    onClick={(e) => { e.stopPropagation(); speakText(label.example!, bcp47) }}
                                >
                                    <Volume2 className="h-3 w-3" />
                                </button>
                            )}
                            <span className="font-semibold">{label.letter}</span>
                            <span className="font-mono text-muted-foreground">/{label.ipa}/</span>
                        </Badge>
                    )
                })}
            </div>

            {/* Drill with filtered exercises */}
            <PracticeDrill
                key={selectedPhoneme ?? 'all'}
                exercises={filtered}
                bcp47={bcp47}
            />
        </div>
    )
}

// ── Main PronunciationContent Component ────────────────────────────────

interface PronunciationContentProps {
    language: LanguageInfo
}

export function PronunciationContent({ language }: PronunciationContentProps) {
    useLearningSession('pronunciation')

    const exercises = useMemo(() => getPronunciationExercises(language.code), [language.code])
    const guides = useMemo(() => getPhonemeGuides(language.code), [language.code])

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/learn/language/${language.code}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold">Aussprache-Feedback — {language.name}</h1>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="practice">
                <TabsList>
                    <TabsTrigger value="practice">
                        <Mic className="h-4 w-4 mr-1" />
                        Üben
                    </TabsTrigger>
                    <TabsTrigger value="difficult">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Schwierige Laute
                    </TabsTrigger>
                    <TabsTrigger value="guide">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Lautführung
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="practice">
                    <PracticeDrill exercises={exercises} bcp47={language.bcp47} />
                </TabsContent>
                <TabsContent value="difficult">
                    <DifficultSoundsPractice exercises={exercises} bcp47={language.bcp47} languageCode={language.code} />
                </TabsContent>
                <TabsContent value="guide">
                    <PhonemeGuidePanel guides={guides} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
