'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    BookOpen,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/tabs'
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from '@/src/components/ui/tooltip'
import { TTSButton } from '@/src/components/TTSButton'
import { useLearningSession } from '@/src/hooks/use-learning-session'
import type { LanguageInfo } from '@/src/lib/language-utils'
import { readingTexts, type ReadingText, type ReadingQuestion } from './reading-texts'

// ── Phase enum ─────────────────────────────────────────────────────────
type Phase = 'selection' | 'reading' | 'questions' | 'results'

// ── Level badge colour mapping ─────────────────────────────────────────
function levelColor(level: string) {
    switch (level) {
        case 'A1': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
        case 'A2': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
        case 'B1': return 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300'
        default:   return ''
    }
}

// ── Main component ─────────────────────────────────────────────────────
interface ReadingContentProps {
    language: LanguageInfo
}

export function ReadingContent({ language }: ReadingContentProps) {
    useLearningSession('reading')

    const searchParams = useSearchParams()
    const router = useRouter()
    const textId = searchParams.get('text')

    const [showVocab, setShowVocab] = useState(false)
    const [answers, setAnswers] = useState<Record<string, string | number | boolean | null>>({})
    const [submitted, setSubmitted] = useState(false)
    const [levelFilter, setLevelFilter] = useState('all')
    const [readingPhase, setReadingPhase] = useState<'reading' | 'questions' | 'results'>('reading')

    // Filter texts for current language
    const textsForLanguage = useMemo(
        () => readingTexts.filter((t) => t.language === language.code),
        [language.code],
    )

    // Derive selected text from URL
    const selectedText = useMemo(
        () => textId ? textsForLanguage.find((t) => t.id === textId) ?? null : null,
        [textId, textsForLanguage],
    )

    const phase: Phase = selectedText ? readingPhase : 'selection'

    // Reset sub-state when text changes
    useEffect(() => {
        setReadingPhase('reading')
        setShowVocab(false)
        setAnswers({})
        setSubmitted(false)
    }, [textId])

    const filteredTexts = useMemo(
        () => levelFilter === 'all'
            ? textsForLanguage
            : textsForLanguage.filter((t) => t.level === levelFilter),
        [textsForLanguage, levelFilter],
    )

    // Levels present for this language
    const availableLevels = useMemo(
        () => [...new Set(textsForLanguage.map((t) => t.level))].sort(),
        [textsForLanguage],
    )

    // ── Handlers ───────────────────────────────────────────────────────
    function selectText(text: ReadingText) {
        router.push(`/learn/language/${language.code}/reading?text=${text.id}`, { scroll: false })
    }

    function goToQuestions() {
        setReadingPhase('questions')
    }

    function handleAnswer(questionId: string, value: string | number | boolean) {
        setAnswers((prev) => ({ ...prev, [questionId]: value }))
    }

    function submitAnswers() {
        setSubmitted(true)
        setReadingPhase('results')
    }

    function backToSelection() {
        router.push(`/learn/language/${language.code}/reading`, { scroll: false })
    }

    // ── Score calculation ──────────────────────────────────────────────
    function calculateScore() {
        if (!selectedText) return { correct: 0, total: 0 }
        let correct = 0
        const gradeable = selectedText.questions.filter((q) => q.type !== 'freeText')
        for (const q of gradeable) {
            const a = answers[q.id]
            if (q.type === 'multipleChoice' && a === q.correctIndex) correct++
            if (q.type === 'trueFalse' && a === (q.correctAnswer ? 0 : 1)) correct++
        }
        return { correct, total: gradeable.length }
    }

    // ── RENDER: Text Selection ─────────────────────────────────────────
    if (phase === 'selection') {
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
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h1 className="text-xl font-bold">Leseübungen — {language.name}</h1>
                    </div>
                </div>

                {textsForLanguage.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground mb-4" />
                            <h2 className="text-lg font-semibold mb-2">Keine Texte verfügbar</h2>
                            <p className="text-sm text-muted-foreground">
                                Für diese Sprache sind noch keine Lesetexte vorhanden.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Level filter tabs */}
                        <Tabs value={levelFilter} onValueChange={setLevelFilter}>
                            <TabsList>
                                <TabsTrigger value="all">Alle</TabsTrigger>
                                {availableLevels.map((lvl) => (
                                    <TabsTrigger key={lvl} value={lvl}>{lvl}</TabsTrigger>
                                ))}
                            </TabsList>

                            {/* Text grid (same content for all tabs, filtered) */}
                            <TabsContent value={levelFilter} forceMount>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {filteredTexts.map((text) => (
                                        <Card
                                            key={text.id}
                                            className="cursor-pointer hover:border-primary/50 transition-colors"
                                            onClick={() => selectText(text)}
                                        >
                                            <CardContent className="p-5 space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl">{text.icon}</span>
                                                        <div>
                                                            <p className="font-semibold">{text.title}</p>
                                                            <p className="text-sm text-muted-foreground">{text.titleDe}</p>
                                                        </div>
                                                    </div>
                                                    <Badge className={levelColor(text.level)}>{text.level}</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {text.readingTimeMinutes} Min.
                                                    </span>
                                                    <span>{text.topic}</span>
                                                    <span>{text.questions.length} Fragen</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>
        )
    }

    // ── RENDER: Reading Phase ──────────────────────────────────────────
    if (phase === 'reading' && selectedText) {
        const wordCount = selectedText.text.split(/\s+/).length
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={backToSelection}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">{selectedText.title}</h1>
                        <p className="text-sm text-muted-foreground">{selectedText.titleDe}</p>
                    </div>
                    <Badge className={levelColor(selectedText.level)}>{selectedText.level}</Badge>
                </div>

                {/* Meta bar */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        ca. {selectedText.readingTimeMinutes} Min.
                    </span>
                    <span>{wordCount} Wörter</span>
                    <TTSButton text={selectedText.text} lang={language.bcp47} size="sm" />
                </div>

                <div className="flex gap-6">
                    {/* Main text */}
                    <Card className="flex-1">
                        <CardContent className="p-6">
                            <TooltipProvider>
                                <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed space-y-4">
                                    {selectedText.text.split('\n\n').map((para, i) => (
                                        <p key={i}>
                                            <HighlightedText
                                                text={para}
                                                vocabulary={selectedText.vocabulary}
                                            />
                                        </p>
                                    ))}
                                </div>
                            </TooltipProvider>
                        </CardContent>
                    </Card>

                    {/* Vocabulary sidebar */}
                    {showVocab && (
                        <Card className="w-72 shrink-0 self-start hidden lg:block">
                            <CardContent className="p-4 space-y-3">
                                <h3 className="font-semibold text-sm">Vokabeln</h3>
                                {selectedText.vocabulary.map((v) => (
                                    <div key={v.word} className="text-sm border-b pb-2 last:border-0">
                                        <p className="font-medium">{v.word}</p>
                                        <p className="text-muted-foreground">{v.translation}</p>
                                        <p className="text-xs text-muted-foreground italic">{v.partOfSpeech}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setShowVocab(!showVocab)}>
                        <BookOpen className="h-4 w-4" />
                        {showVocab ? 'Vokabeln ausblenden' : 'Wörter nachschlagen'}
                    </Button>
                    <Button onClick={goToQuestions}>
                        Fragen beantworten
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    // ── RENDER: Questions / Results Phase ──────────────────────────────
    if ((phase === 'questions' || phase === 'results') && selectedText) {
        const score = calculateScore()
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setReadingPhase('reading')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">
                            {phase === 'results' ? 'Ergebnis' : 'Verständnisfragen'}
                        </h1>
                        <p className="text-sm text-muted-foreground">{selectedText.title}</p>
                    </div>
                    <Badge className={levelColor(selectedText.level)}>{selectedText.level}</Badge>
                </div>

                {/* Score banner (results only) */}
                {submitted && (
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            {score.correct === score.total ? (
                                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-primary">{score.correct}/{score.total}</span>
                                </div>
                            )}
                            <div>
                                <p className="font-semibold">
                                    Du hast {score.correct} von {score.total} Fragen richtig beantwortet
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Freitext-Antworten werden nicht automatisch bewertet.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Questions */}
                <div className="space-y-4">
                    {selectedText.questions.map((q, idx) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={idx}
                            answer={answers[q.id] ?? null}
                            onAnswer={(val) => handleAnswer(q.id, val)}
                            submitted={submitted}
                        />
                    ))}
                </div>

                {/* Submit / Back buttons */}
                <div className="flex items-center gap-3">
                    {!submitted ? (
                        <Button onClick={submitAnswers}>
                            Antworten überprüfen
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setReadingPhase('reading')}>
                                <ArrowLeft className="h-4 w-4" />
                                Zurück zum Text
                            </Button>
                            <Button onClick={backToSelection}>
                                Neuen Text wählen
                            </Button>
                        </>
                    )}
                </div>
            </div>
        )
    }

    return null
}

// ── Highlighted text with vocabulary tooltips ──────────────────────────
function HighlightedText({
    text,
    vocabulary,
}: {
    text: string
    vocabulary: ReadingText['vocabulary']
}) {
    // Build a case-insensitive regex matching any vocab word or its text forms
    if (vocabulary.length === 0) return <>{text}</>

    const allForms: { form: string; vocab: ReadingText['vocabulary'][number] }[] = []
    for (const v of vocabulary) {
        allForms.push({ form: v.word, vocab: v })
        for (const f of v.textForms ?? []) {
            allForms.push({ form: f, vocab: v })
        }
    }
    // Sort longest first so longer matches take priority
    allForms.sort((a, b) => b.form.length - a.form.length)

    const escaped = allForms.map((f) =>
        f.form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )
    const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
    const parts = text.split(pattern)

    return (
        <>
            {parts.map((part, i) => {
                const match = allForms.find(
                    (f) => f.form.toLowerCase() === part.toLowerCase(),
                )?.vocab
                if (match) {
                    return (
                        <Tooltip key={i}>
                            <TooltipTrigger asChild>
                                <span className="underline decoration-primary/40 decoration-dotted underline-offset-4 cursor-help text-primary/90 hover:text-primary transition-colors">
                                    {part}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <span className="font-medium">{match.translation}</span>
                                <span className="text-muted ml-1.5">({match.partOfSpeech})</span>
                            </TooltipContent>
                        </Tooltip>
                    )
                }
                return <span key={i}>{part}</span>
            })}
        </>
    )
}

// ── Individual question card ──────────────────────────────────────────
function QuestionCard({
    question,
    index,
    answer,
    onAnswer,
    submitted,
}: {
    question: ReadingQuestion
    index: number
    answer: string | number | boolean | null
    onAnswer: (val: string | number | boolean) => void
    submitted: boolean
}) {
    const isCorrect = (() => {
        if (question.type === 'freeText') return null
        if (question.type === 'multipleChoice') return answer === question.correctIndex
        if (question.type === 'trueFalse') return answer === (question.correctAnswer ? 0 : 1)
        return null
    })()

    const typeLabel = (() => {
        switch (question.type) {
            case 'multipleChoice': return 'Verständnisfrage'
            case 'trueFalse': return 'Richtig oder Falsch'
            case 'freeText': return 'Eigene Antwort'
        }
    })()

    return (
        <Card>
            <CardContent className="p-5 space-y-3">
                {/* Question header */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">
                            Frage {index + 1} — {typeLabel}
                        </p>
                        <p className="font-medium">{question.question}</p>
                        <p className="text-sm text-muted-foreground">{question.questionDe}</p>
                    </div>
                    {submitted && isCorrect !== null && (
                        isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-1" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-1" />
                        )
                    )}
                </div>

                {/* Multiple choice options */}
                {question.type === 'multipleChoice' && question.options && (
                    <div className="space-y-2">
                        {question.options.map((opt, i) => {
                            const selected = answer === i
                            const isCorrectOption = i === question.correctIndex
                            let optionClass = 'border rounded-lg p-3 text-sm cursor-pointer transition-colors '
                            if (submitted && isCorrectOption) {
                                optionClass += 'border-green-500 bg-green-50 dark:bg-green-950/30'
                            } else if (submitted && selected && !isCorrectOption) {
                                optionClass += 'border-red-500 bg-red-50 dark:bg-red-950/30'
                            } else if (selected) {
                                optionClass += 'border-primary bg-primary/5'
                            } else {
                                optionClass += 'border-border hover:border-primary/30'
                            }
                            return (
                                <button
                                    key={i}
                                    className={optionClass + ' w-full text-left'}
                                    onClick={() => !submitted && onAnswer(i)}
                                    disabled={submitted}
                                >
                                    {opt}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* True/False options */}
                {question.type === 'trueFalse' && question.options && (
                    <div className="flex gap-3">
                        {question.options.map((opt, i) => {
                            const selected = answer === i
                            const isCorrectOption = i === (question.correctAnswer ? 0 : 1)
                            let btnVariant: 'default' | 'outline' | 'destructive' = 'outline'
                            if (submitted && isCorrectOption) btnVariant = 'default'
                            else if (submitted && selected && !isCorrectOption) btnVariant = 'destructive'
                            else if (selected) btnVariant = 'default'
                            return (
                                <Button
                                    key={i}
                                    variant={btnVariant}
                                    size="sm"
                                    onClick={() => !submitted && onAnswer(i)}
                                    disabled={submitted}
                                >
                                    {opt}
                                </Button>
                            )
                        })}
                    </div>
                )}

                {/* Free text */}
                {question.type === 'freeText' && (
                    <div className="space-y-2">
                        <textarea
                            className="w-full border rounded-lg p-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                            rows={3}
                            placeholder="Deine Antwort..."
                            value={(answer as string) ?? ''}
                            onChange={(e) => onAnswer(e.target.value)}
                            disabled={submitted}
                        />
                        {submitted && question.sampleAnswer && (
                            <div className="text-sm p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                                <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">Beispielantwort:</p>
                                <p className="text-blue-700 dark:text-blue-400">{question.sampleAnswer}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Explanation (shown after submit) */}
                {submitted && (
                    <div className="text-sm p-3 border rounded-lg bg-muted">
                        <p className="font-medium mb-1">Erklärung:</p>
                        <p className="text-muted-foreground">{question.explanation}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
