'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    Loader2,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Languages,
    ArrowLeftRight,
    Keyboard,
    RotateCcw,
    Mic,
    BookText,
    Lightbulb,
    Brain,
    MessageCircleQuestion,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { VocabTypeInput } from '@/src/components/VocabTypeInput'
import { TTSButton } from '@/src/components/TTSButton'
import { ConjugationTable } from '@/src/components/ConjugationTable'
import { reviewFlashcard, getDueVocabularyFlashcards, getNewVocabularyFlashcards, getVocabularyFlashcards, getSchedulingPreview } from '@/src/actions/flashcards'
import { Rating } from '@/src/lib/spaced-repetition'
import { generateExampleSentences, generateMnemonic, explainWord, explainError } from '@/src/actions/vocab-ai'
import { VocabSpeechInput } from '@/src/components/VocabSpeechInput'

interface ConjugationData {
    present?: Record<string, string>
    past?: Record<string, string>
    perfect?: Record<string, string>
}

interface VocabCard {
    id: string
    front: string
    back: string
    exampleSentence?: string | null
    partOfSpeech?: string | null
    conjugation?: ConjugationData | null
    context?: string | null
    document?: { id: string; title: string; subject?: string | null } | null
    chunk?: { id: string; content: string; chunkIndex: number } | null
}

// Map document subject to BCP-47 language code for TTS
const SUBJECT_LANG_MAP: Record<string, string> = {
    'Englisch': 'en-US',
    'Spanisch': 'es-ES',
    'Französisch': 'fr-FR',
    'Italienisch': 'it-IT',
    'Portugiesisch': 'pt-PT',
}

function getTargetLang(card: VocabCard): string {
    const subject = card.document?.subject
    if (!subject) return 'de-DE'
    for (const [key, lang] of Object.entries(SUBJECT_LANG_MAP)) {
        if (subject.startsWith(key)) return lang
    }
    return 'de-DE'
}

interface ReviewResult {
    cardId: string
    rating: number
}

type IntervalMap = Record<number, string>

type AiPanelType = 'sentences' | 'mnemonic' | 'explain' | 'error' | null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AiResultDisplay({ type, result }: { type: AiPanelType; result: any }) {
    if (!type || !result) return null

    if (type === 'sentences' && result.sentences) {
        return (
            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Beispielsätze</p>
                {result.sentences.map((s: { sentence: string; translation: string }, i: number) => (
                    <div key={i} className="text-sm">
                        <p className="font-medium">{s.sentence}</p>
                        <p className="text-muted-foreground text-xs">{s.translation}</p>
                    </div>
                ))}
            </div>
        )
    }

    if (type === 'mnemonic') {
        return (
            <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Eselsbrücke</p>
                <p className="text-sm font-medium">{result.mnemonic}</p>
                <p className="text-xs text-muted-foreground">{result.explanation}</p>
            </div>
        )
    }

    if (type === 'explain') {
        return (
            <div className="space-y-2 text-sm">
                <p className="text-xs font-semibold text-muted-foreground">Wort-Erklärung</p>
                {result.etymology && <p><span className="font-medium">Herkunft:</span> {result.etymology}</p>}
                <p><span className="font-medium">Verwendung:</span> {result.usage}</p>
                {result.level && <p><span className="font-medium">Niveau:</span> {result.level}</p>}
                {result.falseFriends?.length > 0 && (
                    <p><span className="font-medium">Falsche Freunde:</span> {result.falseFriends.join(', ')}</p>
                )}
                {result.relatedWords?.length > 0 && (
                    <p><span className="font-medium">Verwandte Wörter:</span> {result.relatedWords.join(', ')}</p>
                )}
            </div>
        )
    }

    if (type === 'error') {
        return (
            <div className="space-y-1 text-sm">
                <p className="text-xs font-semibold text-muted-foreground">Fehler-Erklärung</p>
                <p>{result.explanation}</p>
                <p className="font-medium">Tipp: {result.tip}</p>
                {result.commonMistake && (
                    <p className="text-xs text-muted-foreground">{result.commonMistake}</p>
                )}
            </div>
        )
    }

    return null
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const RATINGS = [
    { rating: Rating.Again, label: 'Nochmal', variant: 'destructive' as const },
    { rating: Rating.Hard, label: 'Schwer', variant: 'outline' as const },
    { rating: Rating.Good, label: 'Gut', variant: 'default' as const },
    { rating: Rating.Easy, label: 'Einfach', variant: 'secondary' as const },
]

export function VocabStudyContent() {
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode') || 'flip'
    const practiceAll = searchParams.get('all') === 'true'
    const newOnly = searchParams.get('new') === 'true'
    const docFilter = searchParams.get('doc') || undefined
    const categoryFilter = searchParams.get('category') || undefined

    const [cards, setCards] = useState<VocabCard[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [reversed, setReversed] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [results, setResults] = useState<ReviewResult[]>([])
    const [completed, setCompleted] = useState(false)
    const [typeResult, setTypeResult] = useState<{ isCorrect: boolean; similarity: number } | null>(null)
    const [intervals, setIntervals] = useState<IntervalMap | null>(null)
    const [aiPanel, setAiPanel] = useState<AiPanelType>(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [aiResult, setAiResult] = useState<any>(null)
    const [aiLoading, setAiLoading] = useState(false)
    const [userTypedInput, setUserTypedInput] = useState('')

    useEffect(() => {
        async function load() {
            try {
                if (practiceAll) {
                    const data = await getVocabularyFlashcards(docFilter, undefined, categoryFilter)
                    setCards(shuffle(data as unknown as VocabCard[]))
                } else if (newOnly) {
                    const data = await getNewVocabularyFlashcards(20, docFilter, categoryFilter)
                    setCards(data as unknown as VocabCard[])
                } else {
                    const data = await getDueVocabularyFlashcards(docFilter, categoryFilter)
                    setCards(data as unknown as VocabCard[])
                }
            } catch (err) {
                console.error('Failed to load vocabulary:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [practiceAll, newOnly, docFilter, categoryFilter])

    const card = cards[currentIndex]
    const progressValue = cards.length > 0 ? (results.length / cards.length) * 100 : 0
    const isLast = currentIndex === cards.length - 1

    // In reversed mode, swap front and back
    const displayFront = card ? (reversed ? card.back : card.front) : ''
    const displayBack = card ? (reversed ? card.front : card.back) : ''
    const isVerb = card?.partOfSpeech?.toLowerCase().includes('verb') ?? false

    // TTS language: front side = target language, back side = German
    const targetLang = card ? getTargetLang(card) : 'de-DE'
    const frontLang = reversed ? 'de-DE' : targetLang
    const backLang = reversed ? targetLang : 'de-DE'

    // Load intervals when card is revealed
    useEffect(() => {
        if (!card) return
        if (!(flipped || typeResult)) return
        let cancelled = false
        getSchedulingPreview(card.id).then((preview) => {
            if (!cancelled) setIntervals(preview)
        }).catch(console.error)
        return () => { cancelled = true }
    }, [card, flipped, typeResult])

    const handleFlip = useCallback(() => {
        if (!flipped) setFlipped(true)
    }, [flipped])

    async function handleRate(rating: number) {
        if (!card || submitting) return
        setSubmitting(true)
        try {
            await reviewFlashcard(card.id, rating)
            const updated = [...results, { cardId: card.id, rating }]
            setResults(updated)

            if (isLast) {
                setCompleted(true)
                return
            }

            setCurrentIndex((i) => i + 1)
            setFlipped(false)
            setTypeResult(null)
            setIntervals(null)
            setAiPanel(null)
            setAiResult(null)
            setUserTypedInput('')
        } catch (err) {
            console.error('Rating failed:', err)
        } finally {
            setSubmitting(false)
        }
    }

    function handleTypeResult(isCorrect: boolean, similarity: number) {
        setTypeResult({ isCorrect, similarity })
    }

    async function handleAiAction(type: AiPanelType) {
        if (!card || aiLoading) return
        if (aiPanel === type) { setAiPanel(null); return }
        setAiPanel(type)
        setAiResult(null)
        setAiLoading(true)
        const lang = card.document?.subject ?? 'Englisch'
        try {
            let result
            switch (type) {
                case 'sentences':
                    result = await generateExampleSentences(card.front, lang)
                    break
                case 'mnemonic':
                    result = await generateMnemonic(card.front, card.back, lang)
                    break
                case 'explain':
                    result = await explainWord(card.front, lang)
                    break
                case 'error':
                    result = await explainError(userTypedInput, displayBack, card.front, lang)
                    break
            }
            setAiResult(result)
        } catch (err) {
            console.error('AI action failed:', err)
            setAiPanel(null)
        } finally {
            setAiLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (cards.length === 0) {
        return (
            <div className="p-6 max-w-3xl mx-auto text-center space-y-6 mt-16">
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Alles gelernt!</h1>
                    <p className="text-muted-foreground mt-2">
                        Aktuell sind keine Vokabeln zur Wiederholung fällig.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/learn/vocabulary">
                        <Languages className="h-4 w-4" />
                        Zurück zum Vokabeltrainer
                    </Link>
                </Button>
            </div>
        )
    }

    // Completion screen
    if (completed) {
        const again = results.filter((r) => r.rating === Rating.Again).length
        const hard = results.filter((r) => r.rating === Rating.Hard).length
        const good = results.filter((r) => r.rating === Rating.Good).length
        const easy = results.filter((r) => r.rating === Rating.Easy).length
        const total = results.length

        return (
            <div className="p-6 max-w-3xl mx-auto space-y-8 mt-8">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">Vokabel-Session abgeschlossen!</h1>
                    <p className="text-muted-foreground">
                        Du hast {total} Vokabel{total !== 1 ? 'n' : ''} durchgearbeitet.
                    </p>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="flex flex-col items-center p-4 gap-2">
                            <XCircle className="h-6 w-6 text-red-600" />
                            <span className="text-2xl font-bold">{again}</span>
                            <span className="text-xs text-muted-foreground">Nochmal</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-4 gap-2">
                            <HelpCircle className="h-6 w-6 text-orange-600" />
                            <span className="text-2xl font-bold">{hard}</span>
                            <span className="text-xs text-muted-foreground">Schwer</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-4 gap-2">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <span className="text-2xl font-bold">{good}</span>
                            <span className="text-xs text-muted-foreground">Gut</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-4 gap-2">
                            <CheckCircle2 className="h-6 w-6 text-blue-600" />
                            <span className="text-2xl font-bold">{easy}</span>
                            <span className="text-xs text-muted-foreground">Einfach</span>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/learn/vocabulary">
                            <Languages className="h-4 w-4" />
                            Zurück zum Vokabeltrainer
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/learn">Dashboard</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Progress */}
            <div className="space-y-2">
                <Progress value={progressValue} />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        {mode === 'type' ? (
                            <><Keyboard className="h-4 w-4" /> Tipp-Modus</>
                        ) : mode === 'speech' ? (
                            <><Mic className="h-4 w-4" /> Sprech-Modus</>
                        ) : (
                            <><RotateCcw className="h-4 w-4" /> Umdrehen-Modus</>
                        )}
                    </span>
                    <span>{results.length + 1} von {cards.length}</span>
                </div>
            </div>

            {/* Direction toggle */}
            <div className="flex justify-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setReversed((r) => !r)
                        setFlipped(false)
                        setTypeResult(null)
                    }}
                    className="text-muted-foreground"
                >
                    <ArrowLeftRight className="h-4 w-4" />
                    {reversed ? 'Antwort → Frage' : 'Frage → Antwort'}
                </Button>
            </div>

            {/* Card display */}
            {mode === 'speech' ? (
                // Speech mode
                <div className="space-y-4">
                    <Card className="min-h-[200px]">
                        <CardContent className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
                            {card.document && (
                                <Badge variant="outline" className="mb-4">{card.document.title}</Badge>
                            )}
                            {card.partOfSpeech && (
                                <Badge variant="secondary" className="mb-2">{card.partOfSpeech}</Badge>
                            )}
                            <div className="flex items-center gap-1">
                                <p className="text-xl font-semibold">{displayFront}</p>
                                <TTSButton text={displayFront} lang={frontLang} />
                            </div>
                        </CardContent>
                    </Card>

                    <VocabSpeechInput
                        key={`${card.id}-${reversed}`}
                        correctAnswer={displayBack}
                        lang={backLang}
                        onResult={handleTypeResult}
                    />

                    {/* Show example sentence after answering */}
                    {typeResult && card.exampleSentence && (
                        <div className="rounded-lg border bg-muted/50 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Beispielsatz</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm italic flex-1">{card.exampleSentence}</p>
                                <TTSButton text={card.exampleSentence} lang={targetLang} size="sm" className="shrink-0" />
                            </div>
                        </div>
                    )}

                    {/* AI toolbar after speech */}
                    {typeResult && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleAiAction('sentences')} disabled={aiLoading && aiPanel !== 'sentences'}>
                                    <BookText className="h-4 w-4" />
                                    Beispielsätze
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleAiAction('mnemonic')} disabled={aiLoading && aiPanel !== 'mnemonic'}>
                                    <Lightbulb className="h-4 w-4" />
                                    Eselsbrücke
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleAiAction('explain')} disabled={aiLoading && aiPanel !== 'explain'}>
                                    <Brain className="h-4 w-4" />
                                    Wort erklären
                                </Button>
                            </div>
                            {aiPanel && (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    {aiLoading ? (
                                        <div className="flex items-center justify-center gap-2 py-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">KI denkt nach...</span>
                                        </div>
                                    ) : (
                                        <AiResultDisplay type={aiPanel} result={aiResult} />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rating buttons after speech */}
                    {typeResult && (
                        <div className="space-y-3">
                            <p className="text-xs text-center text-muted-foreground">
                                Wie gut konntest du die Antwort?
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                                {RATINGS.map((r) => (
                                    <Button
                                        key={r.rating}
                                        variant={r.variant}
                                        onClick={() => handleRate(r.rating)}
                                        disabled={submitting}
                                        className="w-full sm:w-auto sm:min-w-[120px]"
                                    >
                                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <span className="flex flex-col items-center leading-tight">
                                            <span>{r.label}</span>
                                            {intervals && (
                                                <span className="text-[10px] opacity-70">{intervals[r.rating]}</span>
                                            )}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : mode === 'type' ? (
                // Type mode
                <div className="space-y-4">
                    <Card className="min-h-[200px]">
                        <CardContent className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
                            {card.document && (
                                <Badge variant="outline" className="mb-4">{card.document.title}</Badge>
                            )}
                            {card.partOfSpeech && (
                                <Badge variant="secondary" className="mb-2">{card.partOfSpeech}</Badge>
                            )}
                            <div className="flex items-center gap-1">
                                <p className="text-xl font-semibold">{displayFront}</p>
                                <TTSButton text={displayFront} lang={frontLang} />
                            </div>
                        </CardContent>
                    </Card>

                    <VocabTypeInput
                        key={`${card.id}-${reversed}`}
                        correctAnswer={displayBack}
                        onResult={handleTypeResult}
                        onInput={setUserTypedInput}
                    />

                    {/* Show example sentence after answering */}
                    {typeResult && card.exampleSentence && (
                        <div className="rounded-lg border bg-muted/50 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Beispielsatz</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm italic flex-1">{card.exampleSentence}</p>
                                <TTSButton text={card.exampleSentence} lang={targetLang} size="sm" className="shrink-0" />
                            </div>
                        </div>
                    )}

                    {/* AI toolbar after typing */}
                    {typeResult && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleAiAction('sentences')} disabled={aiLoading && aiPanel !== 'sentences'}>
                                    <BookText className="h-4 w-4" />
                                    Beispielsätze
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleAiAction('mnemonic')} disabled={aiLoading && aiPanel !== 'mnemonic'}>
                                    <Lightbulb className="h-4 w-4" />
                                    Eselsbrücke
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleAiAction('explain')} disabled={aiLoading && aiPanel !== 'explain'}>
                                    <Brain className="h-4 w-4" />
                                    Wort erklären
                                </Button>
                                {typeResult && !typeResult.isCorrect && (
                                    <Button variant="ghost" size="sm" onClick={() => handleAiAction('error')} disabled={aiLoading && aiPanel !== 'error'}>
                                        <MessageCircleQuestion className="h-4 w-4" />
                                        Fehler erklären
                                    </Button>
                                )}
                            </div>
                            {aiPanel && (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    {aiLoading ? (
                                        <div className="flex items-center justify-center gap-2 py-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">KI denkt nach...</span>
                                        </div>
                                    ) : (
                                        <AiResultDisplay type={aiPanel} result={aiResult} />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rating buttons after typing */}
                    {typeResult && (
                        <div className="space-y-3">
                            <p className="text-xs text-center text-muted-foreground">
                                Wie gut konntest du die Antwort?
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                                {RATINGS.map((r) => (
                                    <Button
                                        key={r.rating}
                                        variant={r.variant}
                                        onClick={() => handleRate(r.rating)}
                                        disabled={submitting}
                                        className="w-full sm:w-auto sm:min-w-[120px]"
                                    >
                                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <span className="flex flex-col items-center leading-tight">
                                            <span>{r.label}</span>
                                            {intervals && (
                                                <span className="text-[10px] opacity-70">{intervals[r.rating]}</span>
                                            )}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Flip mode
                <div className="space-y-4">
                    <div
                        className="perspective-1000 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={flipped ? 'Karteikarte — Antwortseite' : 'Karteikarte umdrehen'}
                        onClick={handleFlip}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleFlip()
                            }
                        }}
                    >
                        <div
                            className={`relative transition-transform duration-500 [transform-style:preserve-3d] ${
                                flipped ? '[transform:rotateY(180deg)]' : ''
                            }`}
                        >
                            {/* Front */}
                            <Card className="[backface-visibility:hidden] min-h-[240px]">
                                <CardContent className="flex flex-col items-center justify-center min-h-[240px] p-8 text-center">
                                    {card.document && (
                                        <Badge variant="outline" className="mb-4">{card.document.title}</Badge>
                                    )}
                                    {card.partOfSpeech && (
                                        <Badge variant="secondary" className="mb-2">{card.partOfSpeech}</Badge>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <p className="text-xl font-semibold">{displayFront}</p>
                                        <TTSButton text={displayFront} lang={frontLang} />
                                    </div>
                                    {!flipped && (
                                        <p className="text-sm text-muted-foreground mt-6">Klicken zum Umdrehen</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Back */}
                            <Card className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] min-h-[240px]">
                                <CardContent className="flex flex-col items-center justify-center min-h-[240px] p-8 text-center">
                                    <p className="text-xs text-muted-foreground mb-3 italic">{displayFront}</p>
                                    <div className="flex items-center gap-1">
                                        <p className="text-lg">{displayBack}</p>
                                        <TTSButton text={displayBack} lang={backLang} />
                                    </div>
                                    {card.exampleSentence && (
                                        <div className="flex items-center gap-1 mt-4">
                                            <p className="text-sm text-muted-foreground italic">
                                                {card.exampleSentence}
                                            </p>
                                            <TTSButton text={card.exampleSentence} lang={targetLang} size="sm" className="shrink-0 h-6 w-6" />
                                        </div>
                                    )}
                                    {isVerb && card.conjugation && (
                                        <ConjugationTable conjugation={card.conjugation} />
                                    )}
                                    {card.context && (
                                        <p className="text-xs text-muted-foreground mt-3 border-t pt-3">
                                            {card.context}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* AI toolbar after flip */}
                    {flipped && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleAiAction('sentences')} disabled={aiLoading && aiPanel !== 'sentences'}>
                                    <BookText className="h-4 w-4" />
                                    Beispielsätze
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleAiAction('mnemonic')} disabled={aiLoading && aiPanel !== 'mnemonic'}>
                                    <Lightbulb className="h-4 w-4" />
                                    Eselsbrücke
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleAiAction('explain')} disabled={aiLoading && aiPanel !== 'explain'}>
                                    <Brain className="h-4 w-4" />
                                    Wort erklären
                                </Button>
                            </div>
                            {aiPanel && (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    {aiLoading ? (
                                        <div className="flex items-center justify-center gap-2 py-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">KI denkt nach...</span>
                                        </div>
                                    ) : (
                                        <AiResultDisplay type={aiPanel} result={aiResult} />
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rating buttons after flip */}
                    {flipped && (
                        <div className="space-y-3">
                            <p className="text-xs text-center text-muted-foreground">
                                Wie gut konntest du die Antwort?
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                                {RATINGS.map((r) => (
                                    <Button
                                        key={r.rating}
                                        variant={r.variant}
                                        onClick={() => handleRate(r.rating)}
                                        disabled={submitting}
                                        className="w-full sm:w-auto sm:min-w-[120px]"
                                    >
                                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <span className="flex flex-col items-center leading-tight">
                                            <span>{r.label}</span>
                                            {intervals && (
                                                <span className="text-[10px] opacity-70">{intervals[r.rating]}</span>
                                            )}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
