'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/src/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Progress } from '@/src/components/ui/progress'
import { Textarea } from '@/src/components/ui/textarea'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/src/components/ai-elements/reasoning'
import { evaluateAnswer } from '@/src/actions/quiz'
import { TTSButton } from '@/src/components/TTSButton'
import { isFreetextLikeType } from '@/src/lib/quiz-types'
import { SortableWordChips } from '@/src/components/quiz/SortableWordChips'


interface Question {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    questionType?: string
    difficulty?: number
    ttsText?: string | null
    ttsLang?: string | null
}

const DIFFICULTY_LABELS: Record<number, string> = {
    1: 'Grundwissen',
    2: 'Verständnis',
    3: 'Transfer',
}

const DIFFICULTY_COLORS: Record<number, string> = {
    1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    2: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    3: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
}

interface AnswerResult {
    isCorrect: boolean
    correctIndex: number | null
    correctIndices?: number[]
    explanation?: string
    reasoning?: string
    freeTextScore?: number
    freeTextFeedback?: string
    correctAnswer?: string
    sourceSnippet?: string
}

// Map document subject to BCP-47 language code for TTS
const SUBJECT_LANG_MAP: Record<string, string> = {
    'Englisch': 'en-US',
    'Spanisch': 'es-ES',
    'Französisch': 'fr-FR',
    'Italienisch': 'it-IT',
    'Portugiesisch': 'pt-PT',
}

// Map scenario language code (ISO 639-1) to BCP-47
const SCENARIO_LANG_BCP47: Record<string, string> = {
    es: 'es-ES',
    en: 'en-US',
    fr: 'fr-FR',
}

interface QuizPlayerProps {
    quizId: string
    quizTitle: string
    questions: Question[]
    onComplete: (results: Map<string, AnswerResult>) => void
    subject?: string | null
    scenarioLanguage?: string | null
}

const TYPE_LABELS: Record<string, string> = {
    singleChoice: 'Single Choice',
    multipleChoice: 'Multiple Choice',
    freetext: 'Freitext',
    truefalse: 'Wahr/Falsch',
    cloze: 'Lückentext',
    fillInBlanks: 'Lückentext (mehrfach)',
    conjugation: 'Konjugation',
    sentenceOrder: 'Satzordnung',
}

export function QuizPlayer({ quizTitle, questions, onComplete, subject, scenarioLanguage }: QuizPlayerProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [freeTextAnswer, setFreeTextAnswer] = useState('')
    const [result, setResult] = useState<AnswerResult | null>(null)
    const [results, setResults] = useState<Map<string, AnswerResult>>(new Map())
    const [selectedIndices, setSelectedIndices] = useState<number[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [fillInBlanksAnswers, setFillInBlanksAnswers] = useState<string[]>([])
    const [conjugationAnswers, setConjugationAnswers] = useState<string[]>([])
    const [orderedWords, setOrderedWords] = useState<string[]>([])
    const [answerHistory, setAnswerHistory] = useState<Map<number, { selectedIndex: number | null; selectedIndices: number[]; freeTextAnswer: string; fillInBlanksAnswers: string[]; conjugationAnswers: string[]; orderedWords: string[]; result: AnswerResult | null }>>(new Map())

    const currentQuestion = questions[currentIndex]
    const isLastQuestion = currentIndex === questions.length - 1
    const progress = ((currentIndex + (result ? 1 : 0)) / questions.length) * 100
    const isFreetext = currentQuestion?.questionType === 'freetext'
    const isCloze = currentQuestion?.questionType === 'cloze'
    const isMultipleChoice = currentQuestion?.questionType === 'multipleChoice'
    const isFillInBlanks = currentQuestion?.questionType === 'fillInBlanks'
    const isConjugation = currentQuestion?.questionType === 'conjugation'
    const isSentenceOrder = currentQuestion?.questionType === 'sentenceOrder'

    async function handleSubmit() {
        if (!currentQuestion) return
        if (isMultipleChoice && selectedIndices.length === 0) return
        if (!isMultipleChoice && !isFreetext && !isCloze && !isFillInBlanks && !isConjugation && !isSentenceOrder && selectedIndex === null) return
        if ((isFreetext || isCloze) && !freeTextAnswer.trim()) return

        setSubmitting(true)

        // Serialize answer for new types
        let serializedFreeText: string | undefined
        if (isFillInBlanks) {
            serializedFreeText = JSON.stringify(fillInBlanksAnswers)
        } else if (isConjugation) {
            serializedFreeText = JSON.stringify(conjugationAnswers)
        } else if (isSentenceOrder) {
            serializedFreeText = orderedWords.join(' ')
        } else if (isFreetext || isCloze) {
            serializedFreeText = freeTextAnswer
        }

        try {
            const data = await evaluateAnswer(
                currentQuestion.id,
                isFreetextLikeType(currentQuestion.questionType) || isMultipleChoice ? null : selectedIndex,
                serializedFreeText,
                isMultipleChoice ? selectedIndices : undefined,
            ) as AnswerResult
            setResult(data)

            const newResults = new Map(results)
            newResults.set(currentQuestion.id, data)
            setResults(newResults)
        } catch (error) {
            console.error('Evaluation error:', error)
        } finally {
            setSubmitting(false)
        }
    }

    function handleNext() {
        // Save current state to history
        setAnswerHistory(prev => {
            const next = new Map(prev)
            next.set(currentIndex, { selectedIndex, selectedIndices, freeTextAnswer, fillInBlanksAnswers, conjugationAnswers, orderedWords, result })
            return next
        })

        if (isLastQuestion) {
            onComplete(results)
            return
        }

        const nextIndex = currentIndex + 1
        const nextState = answerHistory.get(nextIndex)
        setCurrentIndex(nextIndex)
        setSelectedIndex(nextState?.selectedIndex ?? null)
        setSelectedIndices(nextState?.selectedIndices ?? [])
        setFreeTextAnswer(nextState?.freeTextAnswer ?? '')
        setFillInBlanksAnswers(nextState?.fillInBlanksAnswers ?? [])
        setConjugationAnswers(nextState?.conjugationAnswers ?? [])
        setOrderedWords(nextState?.orderedWords ?? [])
        setResult(nextState?.result ?? null)
    }

    function handleSkip() {
        // Save current empty state
        setAnswerHistory(prev => {
            const next = new Map(prev)
            next.set(currentIndex, { selectedIndex: null, selectedIndices: [], freeTextAnswer: '', fillInBlanksAnswers: [], conjugationAnswers: [], orderedWords: [], result: null })
            return next
        })

        const skipResult: AnswerResult = {
            isCorrect: false,
            correctIndex: null,
            explanation: 'Frage wurde übersprungen.',
        }
        const newResults = new Map(results)
        newResults.set(currentQuestion.id, skipResult)
        setResults(newResults)

        if (isLastQuestion) {
            onComplete(newResults)
            return
        }
        setCurrentIndex(i => i + 1)
        setSelectedIndex(null)
        setSelectedIndices([])
        setFreeTextAnswer('')
        setFillInBlanksAnswers([])
        setConjugationAnswers([])
        setOrderedWords([])
        setResult(null)
    }

    function handleBack() {
        if (currentIndex === 0) return
        // Save current state
        setAnswerHistory(prev => {
            const next = new Map(prev)
            next.set(currentIndex, { selectedIndex, selectedIndices, freeTextAnswer, fillInBlanksAnswers, conjugationAnswers, orderedWords, result })
            return next
        })

        const prevIndex = currentIndex - 1
        const prevState = answerHistory.get(prevIndex)
        setCurrentIndex(prevIndex)
        setSelectedIndex(prevState?.selectedIndex ?? null)
        setSelectedIndices(prevState?.selectedIndices ?? [])
        setFreeTextAnswer(prevState?.freeTextAnswer ?? '')
        setFillInBlanksAnswers(prevState?.fillInBlanksAnswers ?? [])
        setConjugationAnswers(prevState?.conjugationAnswers ?? [])
        setOrderedWords(prevState?.orderedWords ?? [])
        setResult(prevState?.result ?? null)
    }

    if (!currentQuestion) return null

    const options = currentQuestion.options
    const canSubmit = (isFreetext || isCloze)
        ? !!freeTextAnswer.trim()
        : isFillInBlanks
            ? fillInBlanksAnswers.some((a) => a.trim())
            : isConjugation
                ? conjugationAnswers.some((a) => a.trim())
                : isSentenceOrder
                    ? orderedWords.length > 0
                    : isMultipleChoice
                        ? selectedIndices.length > 0
                        : selectedIndex !== null

    // For cloze/fillInBlanks: questionText is encoded as "<German question>\n\n<sentence with {{blank}}>"
    // Split at the first double-newline to separate question from sentence template.
    // Fall back to the full questionText as the sentence if no separator is found (legacy questions).
    function splitClozeText(raw: string): { question: string; sentence: string } {
        const idx = raw.indexOf('\n\n')
        if (idx !== -1) return { question: raw.slice(0, idx), sentence: raw.slice(idx + 2) }
        return { question: '', sentence: raw }
    }
    const clozeQuestion = isCloze ? splitClozeText(currentQuestion.questionText) : null
    const fillInBlanksQuestion = isFillInBlanks ? splitClozeText(currentQuestion.questionText) : null

    // Split cloze/fillInBlanks sentence template around {{blank}}
    const clozeParts = clozeQuestion ? clozeQuestion.sentence.split('{{blank}}') : []
    const fillInBlanksParts = fillInBlanksQuestion ? fillInBlanksQuestion.sentence.split('{{blank}}') : []

    // TTS for language quizzes - use data from question, or derive from scenario/subject
    const ttsText = currentQuestion.ttsText ?? null
    const ttsLang = currentQuestion.ttsLang
        ?? (scenarioLanguage ? SCENARIO_LANG_BCP47[scenarioLanguage] : null)
        ?? (subject ? SUBJECT_LANG_MAP[subject] : null)
        ?? null

    // Derive the target-language text to read after answering
    function getAnswerTTSText(res: AnswerResult): string | null {
        if (!ttsLang) return null
        // For types that return correctAnswer (cloze, freetext, sentenceOrder, fillInBlanks, conjugation)
        if (res.correctAnswer) return res.correctAnswer
        // For singleChoice / truefalse: read the correct option
        if (res.correctIndex != null && currentQuestion.options) {
            return (currentQuestion.options as string[])[res.correctIndex] ?? null
        }
        // For multipleChoice: join correct options
        if (res.correctIndices?.length && currentQuestion.options) {
            return res.correctIndices.map(i => (currentQuestion.options as string[])[i]).join(' / ')
        }
        return null
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{quizTitle}</span>
                </div>
                <Progress value={progress} />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <Link href="/learn/quiz" className="hover:text-foreground transition-colors">
                        &larr; Quiz abbrechen
                    </Link>
                    <span>Frage {currentIndex + 1} von {questions.length}</span>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-start gap-2">
                        {!isFillInBlanks && !isCloze && (
                            <CardTitle className="text-lg flex-1">
                                {/* Render question text with inline TTS button inside «...» */}
                                {ttsText && ttsLang ? (
                                    (() => {
                                        const match = currentQuestion.questionText.match(/^(.*?«)(.+?)(».*)$/)
                                        if (match) {
                                            return (
                                                <>
                                                    {match[1]}
                                                    {match[2]}{' '}
                                                    <TTSButton text={ttsText} lang={ttsLang} size="sm" className="inline-block align-middle" />
                                                    {' '}{match[3]}
                                                </>
                                            )
                                        }
                                        return currentQuestion.questionText
                                    })()
                                ) : (
                                    currentQuestion.questionText
                                )}
                            </CardTitle>
                        )}
                        {(isFillInBlanks || isCloze) && (
                            <CardTitle className="text-lg flex-1">
                                {isCloze
                                    ? (clozeQuestion?.question || 'Welches Wort fehlt in diesem Satz?')
                                    : (fillInBlanksQuestion?.question || 'Welche Wörter fehlen in diesem Satz?')}
                            </CardTitle>
                        )}
                    </div>
                    {currentQuestion.difficulty && currentQuestion.difficulty > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <Badge className={`text-xs font-normal border-0 ${DIFFICULTY_COLORS[currentQuestion.difficulty] ?? ''}`}>
                                {DIFFICULTY_LABELS[currentQuestion.difficulty] ?? `Stufe ${currentQuestion.difficulty}`}
                            </Badge>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {/* Multi: show Checkboxes */}
                    {isMultipleChoice && options && options.length > 0 && (
                        <div className="space-y-2">
                            {options.map((option, i) => {
                                const correctSet = result?.correctIndices ?? []
                                const isSelected = selectedIndices.includes(i)
                                let itemClass = ''
                                if (result && correctSet.length > 0) {
                                    if (correctSet.includes(i)) {
                                        itemClass = 'border-green-500 bg-green-50 dark:bg-green-950'
                                    } else if (isSelected) {
                                        itemClass = 'border-red-500 bg-red-50 dark:bg-red-950'
                                    }
                                }

                                return (
                                    <label
                                        key={i}
                                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent ${itemClass}`}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => {
                                                if (!result) {
                                                    setSelectedIndices(prev =>
                                                        prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
                                                    )
                                                }
                                            }}
                                            disabled={!!result}
                                        />
                                        <span className="text-sm">{option}</span>
                                        {result && correctSet.includes(i) && (
                                            <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                                        )}
                                        {result && isSelected && !correctSet.includes(i) && (
                                            <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                        )}
                                    </label>
                                )
                            })}
                        </div>
                    )}

                    {/* MC / True-False: show RadioGroup */}
                    {!isMultipleChoice && !isCloze && !isFillInBlanks && !isConjugation && !isSentenceOrder && options && options.length > 0 && (
                        <RadioGroup
                            value={selectedIndex !== null ? String(selectedIndex) : ''}
                            onValueChange={(v) => {
                                if (!result) setSelectedIndex(Number(v))
                            }}
                            disabled={!!result}
                        >
                            {options.map((option, i) => {
                                let itemClass = ''
                                if (result && result.correctIndex !== null) {
                                    if (i === result.correctIndex) {
                                        itemClass = 'border-green-500 bg-green-50 dark:bg-green-950'
                                    } else if (i === selectedIndex && !result.isCorrect) {
                                        itemClass = 'border-red-500 bg-red-50 dark:bg-red-950'
                                    }
                                }

                                return (
                                    <label
                                        key={i}
                                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent ${itemClass}`}
                                    >
                                        <RadioGroupItem value={String(i)} />
                                        <span className="text-sm">{option}</span>
                                        {result && result.correctIndex !== null && i === result.correctIndex && (
                                            <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                                        )}
                                        {result && i === selectedIndex && !result.isCorrect && result.correctIndex !== null && i !== result.correctIndex && (
                                            <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                        )}
                                    </label>
                                )
                            })}
                        </RadioGroup>
                    )}

                    {/* Cloze: inline input in sentence */}
                    {isCloze && (
                        <div className="space-y-2">
                            <p className="text-lg leading-relaxed">
                                {clozeParts.map((part, i) => (
                                    <span key={i}>
                                        {part}
                                        {i < clozeParts.length - 1 && (
                                            <input
                                                type="text"
                                                value={freeTextAnswer}
                                                onChange={(e) => {
                                                    if (!result) setFreeTextAnswer(e.target.value)
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !result && canSubmit) handleSubmit()
                                                }}
                                                disabled={!!result}
                                                autoFocus
                                                className={`inline-block w-40 mx-1 px-2 py-0.5 text-center border-b-2 bg-transparent outline-none text-base ${
                                                    result
                                                        ? result.isCorrect || (result.freeTextScore ?? 0) >= 0.5
                                                            ? 'border-green-500 text-green-700 dark:text-green-400'
                                                            : 'border-red-500 text-red-700 dark:text-red-400'
                                                        : 'border-primary focus:border-primary'
                                                }`}
                                                placeholder="___"
                                                maxLength={100}
                                            />
                                        )}
                                    </span>
                                ))}
                            </p>
                        </div>
                    )}

                    {/* FillInBlanks: multiple inline inputs */}
                    {isFillInBlanks && (
                        <div className="space-y-2">
                            <p className="text-lg leading-relaxed">
                                {fillInBlanksParts.map((part, i) => (
                                    <span key={i}>
                                        {part}
                                        {i < fillInBlanksParts.length - 1 && (
                                            <input
                                                type="text"
                                                value={fillInBlanksAnswers[i] ?? ''}
                                                onChange={(e) => {
                                                    if (!result) {
                                                        const next = [...fillInBlanksAnswers]
                                                        next[i] = e.target.value
                                                        setFillInBlanksAnswers(next)
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !result && canSubmit) handleSubmit()
                                                }}
                                                disabled={!!result}
                                                autoFocus={i === 0}
                                                className={`inline-block w-40 mx-1 px-2 py-0.5 text-center border-b-2 bg-transparent outline-none text-base ${
                                                    result
                                                        ? (result.freeTextScore ?? 0) >= 0.5
                                                            ? 'border-green-500 text-green-700 dark:text-green-400'
                                                            : 'border-red-500 text-red-700 dark:text-red-400'
                                                        : 'border-primary focus:border-primary'
                                                }`}
                                                placeholder="___"
                                                maxLength={100}
                                            />
                                        )}
                                    </span>
                                ))}
                            </p>
                        </div>
                    )}

                    {/* Conjugation: table with person labels + inputs */}
                    {isConjugation && options && (
                        <div className="space-y-3">
                            <div className="grid gap-2">
                                {(options as string[]).map((person, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-sm font-medium w-24 text-right shrink-0">{person}</span>
                                        <input
                                            type="text"
                                            value={conjugationAnswers[i] ?? ''}
                                            onChange={(e) => {
                                                if (!result) {
                                                    const next = [...conjugationAnswers]
                                                    next[i] = e.target.value
                                                    setConjugationAnswers(next)
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !result && canSubmit) handleSubmit()
                                            }}
                                            disabled={!!result}
                                            autoFocus={i === 0}
                                            className={`flex-1 px-3 py-1.5 rounded border text-sm bg-transparent outline-none ${
                                                result
                                                    ? (result.freeTextScore ?? 0) >= 0.5
                                                        ? 'border-green-500'
                                                        : 'border-red-500'
                                                    : 'border-input focus:border-primary'
                                            }`}
                                            placeholder="…"
                                            maxLength={100}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SentenceOrder: drag-and-drop word chips */}
                    {isSentenceOrder && options && (
                        <div className="space-y-3">
                            <SortableWordChips
                                words={orderedWords.length > 0 ? orderedWords : (options as string[])}
                                onChange={(words) => {
                                    if (!result) setOrderedWords(words)
                                }}
                                disabled={!!result}
                            />
                        </div>
                    )}

                    {/* Freetext: show only Textarea */}
                    {isFreetext && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Deine Antwort:
                            </label>
                            <Textarea
                                value={freeTextAnswer}
                                onChange={(e) => {
                                    if (!result) setFreeTextAnswer(e.target.value)
                                }}
                                disabled={!!result}
                                placeholder="Schreibe deine Antwort hier..."
                                maxLength={2000}
                                rows={4}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {freeTextAnswer.length}/2000
                            </p>
                        </div>
                    )}

                    {result && (
                        <div className="mt-4 p-4 rounded-lg border bg-muted/50 space-y-3">
                            <div className="flex items-center gap-2">
                                {isFreetextLikeType(currentQuestion.questionType) ? (
                                    <Badge variant="outline">
                                        Bewertung: {Math.round((result.freeTextScore ?? 0) * 100)}%
                                    </Badge>
                                ) : result.isCorrect ? (
                                    <Badge className="bg-green-600">Richtig</Badge>
                                ) : (
                                    <Badge variant="destructive">Falsch</Badge>
                                )}
                                {(() => {
                                    const answerTTS = getAnswerTTSText(result)
                                    return answerTTS && ttsLang ? (
                                        <TTSButton text={answerTTS} lang={ttsLang} size="sm" />
                                    ) : null
                                })()}
                            </div>
                            {(isCloze || isFillInBlanks || isSentenceOrder) && result.correctAnswer && (
                                <p className="text-sm font-medium">
                                    Richtige Antwort: <span className="text-green-600">{result.correctAnswer}</span>
                                </p>
                            )}
                            {result.reasoning && (
                                <Reasoning defaultOpen={false}>
                                    <ReasoningTrigger getThinkingMessage={() => (
                                        <p>Überlegungen des Modells</p>
                                    )} />
                                    <ReasoningContent>{result.reasoning}</ReasoningContent>
                                </Reasoning>
                            )}
                            {result.explanation && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {result.explanation}
                                </p>
                            )}
                            {result.freeTextFeedback && (
                                <div className="pt-2 border-t">
                                    <p className="text-sm font-medium mb-1">Feedback:</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {result.freeTextFeedback}
                                    </p>
                                </div>
                            )}
                            {result.sourceSnippet && (
                                <div className="pt-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Quelle:</p>
                                    <p className="text-xs text-muted-foreground italic line-clamp-4">
                                        &ldquo;{result.sourceSnippet}&rdquo;
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Back button — only when not on first question and no result yet */}
                        {currentIndex > 0 && !result && (
                            <Button variant="outline" onClick={handleBack}>
                                Zurück
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!result ? (
                            <>
                                <Button variant="ghost" onClick={handleSkip}>
                                    Überspringen
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || submitting}
                                >
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Antwort prüfen
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleNext}>
                                {isLastQuestion ? 'Ergebnisse anzeigen' : 'Nächste Frage'}
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
