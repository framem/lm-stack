'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, PenLine, Puzzle, Shuffle, Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/src/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/tabs'
import { Textarea } from '@/src/components/ui/textarea'
import { Badge } from '@/src/components/ui/badge'
import { useLearningSession } from '@/src/hooks/use-learning-session'
import { evaluateWriting, type WritingFeedback } from '@/src/actions/writing-feedback'
import { getExercises, getWritingPrompts, type ClozeExercise, type ReorderExercise } from './writing-exercises'
import type { LanguageInfo } from '@/src/lib/language-utils'

// ── Types ──

interface WritingContentProps {
    language: LanguageInfo
}

// ── Main component ──

export function WritingContent({ language }: WritingContentProps) {
    useLearningSession('writing')

    const [level, setLevel] = useState('A1')
    const levels = ['A1', 'A2', 'B1', 'B2']

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
                    <PenLine className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold">Schreibübungen — {language.name}</h1>
                </div>
            </div>

            {/* Level selector */}
            <div className="flex gap-2">
                {levels.map((l) => (
                    <Button
                        key={l}
                        variant={level === l ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLevel(l)}
                    >
                        {l}
                    </Button>
                ))}
            </div>

            {/* Exercise tabs */}
            <Tabs defaultValue="free">
                <TabsList>
                    <TabsTrigger value="free">
                        <PenLine className="h-4 w-4" />
                        Freies Schreiben
                    </TabsTrigger>
                    <TabsTrigger value="cloze">
                        <Puzzle className="h-4 w-4" />
                        Lückentext
                    </TabsTrigger>
                    <TabsTrigger value="reorder">
                        <Shuffle className="h-4 w-4" />
                        Satzumstellung
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="free">
                    <FreeWriting languageCode={language.code} languageName={language.name} level={level} />
                </TabsContent>
                <TabsContent value="cloze">
                    <ClozeMode languageCode={language.code} level={level} />
                </TabsContent>
                <TabsContent value="reorder">
                    <ReorderMode languageCode={language.code} level={level} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

// ── Free Writing Mode ──

function FreeWriting({ languageCode, languageName, level }: { languageCode: string; languageName: string; level: string }) {
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState<WritingFeedback | null>(null)
    const [error, setError] = useState<string | null>(null)

    const prompts = useMemo(() => getWritingPrompts(level), [level])

    async function handleEvaluate() {
        if (!text.trim()) return
        setLoading(true)
        setError(null)
        setFeedback(null)
        try {
            const result = await evaluateWriting(text, languageName, level)
            setFeedback(result)
        } catch {
            setError('Feedback konnte nicht erstellt werden. Bitte versuche es erneut.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4 mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Freies Schreiben</CardTitle>
                    <CardDescription>
                        Schreibe einen Text und erhalte KI-gestütztes Feedback zu Grammatik, Wortschatz und Stil.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Topic suggestions */}
                    {prompts.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Themenvorschläge:</p>
                            <div className="flex flex-wrap gap-2">
                                {prompts.map((prompt, i) => (
                                    <Badge
                                        key={i}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-accent"
                                        onClick={() => setText(prompt)}
                                    >
                                        {prompt}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={`Schreibe hier deinen Text auf ${languageName}...`}
                        className="min-h-[200px]"
                    />

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {text.trim().split(/\s+/).filter(Boolean).length} Wörter
                        </span>
                        <Button onClick={handleEvaluate} disabled={loading || !text.trim()}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Wird ausgewertet...
                                </>
                            ) : (
                                'Feedback erhalten'
                            )}
                        </Button>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                </CardContent>
            </Card>

            {/* Feedback display */}
            {feedback && <FeedbackDisplay feedback={feedback} />}
        </div>
    )
}

// ── Feedback display ──

function FeedbackDisplay({ feedback }: { feedback: WritingFeedback }) {
    const categories = [
        { label: 'Grammatik', value: feedback.grammar },
        { label: 'Wortschatz', value: feedback.vocabulary },
        { label: 'Stil', value: feedback.style },
        { label: 'Gesamtnote', value: feedback.overall },
    ]

    function getScoreColor(score: number) {
        if (score >= 80) return 'text-green-600 dark:text-green-400'
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bewertung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Score grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((cat) => (
                        <div key={cat.label} className="text-center space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">{cat.label}</p>
                            <p className={`text-2xl font-bold ${getScoreColor(cat.value)}`}>
                                {cat.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Written feedback */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Feedback:</p>
                    <p className="text-sm text-muted-foreground">{feedback.feedback}</p>
                </div>

                {/* Corrections */}
                {feedback.corrections.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium">Korrekturen:</p>
                        {feedback.corrections.map((c, i) => (
                            <div key={i} className="rounded-lg border p-3 space-y-1">
                                <div className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                                    <span className="text-sm line-through text-muted-foreground">{c.original}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                                    <span className="text-sm font-medium">{c.corrected}</span>
                                </div>
                                <p className="text-xs text-muted-foreground pl-6">{c.explanation}</p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ── Cloze (Gap-fill) Mode ──

function ClozeMode({ languageCode, level }: { languageCode: string; level: string }) {
    const exercises = useMemo(() => getExercises(languageCode, level), [languageCode, level])
    const clozeItems = exercises.cloze
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [checked, setChecked] = useState(false)

    const handleReset = useCallback(() => {
        setAnswers({})
        setChecked(false)
    }, [])

    if (clozeItems.length === 0) {
        return (
            <Card className="mt-4">
                <CardContent className="py-8 text-center text-muted-foreground">
                    Keine Lückentext-Übungen für diese Sprache und dieses Niveau verfügbar.
                </CardContent>
            </Card>
        )
    }

    function isCorrect(index: number, exercise: ClozeExercise) {
        const answer = (answers[index] ?? '').trim().toLowerCase()
        return exercise.blanks.some((b) => b.toLowerCase() === answer)
    }

    const correctCount = clozeItems.filter((ex, i) => isCorrect(i, ex)).length

    return (
        <div className="space-y-4 mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Lückentext</CardTitle>
                    <CardDescription>
                        Fülle die Lücken mit dem richtigen Wort aus.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {clozeItems.map((exercise, index) => {
                        const parts = exercise.sentence.split('___')
                        const correct = checked && isCorrect(index, exercise)
                        const wrong = checked && !isCorrect(index, exercise)

                        return (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center gap-1 flex-wrap text-sm">
                                    {parts.map((part, pIdx) => (
                                        <span key={pIdx} className="flex items-center gap-1">
                                            {part}
                                            {pIdx < parts.length - 1 && (
                                                <input
                                                    type="text"
                                                    value={answers[index] ?? ''}
                                                    onChange={(e) =>
                                                        setAnswers((prev) => ({ ...prev, [index]: e.target.value }))
                                                    }
                                                    disabled={checked}
                                                    className={`inline-block w-28 border-b-2 bg-transparent px-1 py-0.5 text-center outline-none transition-colors ${
                                                        correct
                                                            ? 'border-green-500 text-green-700 dark:text-green-400'
                                                            : wrong
                                                              ? 'border-red-500 text-red-700 dark:text-red-400'
                                                              : 'border-muted-foreground/30 focus:border-primary'
                                                    }`}
                                                    placeholder="..."
                                                />
                                            )}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Hinweis: {exercise.hint}
                                </p>
                                {wrong && (
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        Richtige Antwort: {exercise.blanks.join(' / ')}
                                    </p>
                                )}
                            </div>
                        )
                    })}

                    <div className="flex items-center gap-3 pt-2">
                        {!checked ? (
                            <Button onClick={() => setChecked(true)}>
                                Antworten prüfen
                            </Button>
                        ) : (
                            <>
                                <p className="text-sm font-medium">
                                    {correctCount} von {clozeItems.length} richtig
                                </p>
                                <Button variant="outline" onClick={handleReset}>
                                    <RotateCcw className="h-4 w-4" />
                                    Nochmal
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ── Sentence Reordering Mode ──

function ReorderMode({ languageCode, level }: { languageCode: string; level: string }) {
    const exercises = useMemo(() => getExercises(languageCode, level), [languageCode, level])
    const reorderItems = exercises.reorder
    const [currentIndex, setCurrentIndex] = useState(0)

    if (reorderItems.length === 0) {
        return (
            <Card className="mt-4">
                <CardContent className="py-8 text-center text-muted-foreground">
                    Keine Satzumstellungs-Übungen für diese Sprache und dieses Niveau verfügbar.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Übung {currentIndex + 1} von {reorderItems.length}
                </p>
                <div className="flex gap-1">
                    {reorderItems.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`h-2 w-6 rounded-full transition-colors ${
                                i === currentIndex ? 'bg-primary' : 'bg-muted'
                            }`}
                        />
                    ))}
                </div>
            </div>
            <ReorderExerciseCard
                key={`${languageCode}-${level}-${currentIndex}`}
                exercise={reorderItems[currentIndex]}
                onNext={currentIndex < reorderItems.length - 1 ? () => setCurrentIndex(currentIndex + 1) : undefined}
            />
        </div>
    )
}

function ReorderExerciseCard({ exercise, onNext }: { exercise: ReorderExercise; onNext?: () => void }) {
    const [selected, setSelected] = useState<number[]>([])
    const [checked, setChecked] = useState(false)
    const dragIndexRef = useRef<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

    const builtSentence = selected.map((i) => exercise.words[i]).join(' ')
    const isCorrect = builtSentence.toLowerCase() === exercise.correct.toLowerCase()
    const availableIndices = exercise.words.map((_, i) => i).filter((i) => !selected.includes(i))

    function handleSelect(wordIndex: number) {
        if (checked) return
        setSelected((prev) => [...prev, wordIndex])
    }

    function handleRemoveFromSentence(positionIndex: number) {
        if (checked) return
        setSelected((prev) => prev.filter((_, i) => i !== positionIndex))
    }

    function handleReset() {
        setSelected([])
        setChecked(false)
    }

    // Drag-and-drop handlers for reordering built sentence
    function handleDragStart(posIndex: number) {
        dragIndexRef.current = posIndex
    }

    function handleDragOver(e: React.DragEvent, posIndex: number) {
        e.preventDefault()
        if (dragIndexRef.current !== null && dragIndexRef.current !== posIndex) {
            setDragOverIndex(posIndex)
        }
    }

    function handleDrop(posIndex: number) {
        const from = dragIndexRef.current
        if (from === null || from === posIndex) {
            dragIndexRef.current = null
            setDragOverIndex(null)
            return
        }
        setSelected((prev) => {
            const next = [...prev]
            const [moved] = next.splice(from, 1)
            next.splice(posIndex, 0, moved)
            return next
        })
        dragIndexRef.current = null
        setDragOverIndex(null)
    }

    function handleDragEnd() {
        dragIndexRef.current = null
        setDragOverIndex(null)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Satzumstellung</CardTitle>
                <CardDescription>
                    Klicke die Wörter an und ordne sie per Drag & Drop in die richtige Reihenfolge.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Translation hint */}
                <p className="text-sm text-muted-foreground">
                    Übersetzung: <span className="italic">{exercise.translation}</span>
                </p>

                {/* Built sentence area */}
                <div className={`min-h-[48px] rounded-lg border-2 border-dashed p-3 flex flex-wrap gap-2 ${
                    checked
                        ? isCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                            : 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-muted-foreground/20'
                }`}>
                    {selected.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Klicke auf die Wörter unten...</span>
                    ) : (
                        selected.map((wordIndex, posIndex) => (
                            <Badge
                                key={`${posIndex}-${wordIndex}`}
                                variant="default"
                                draggable={!checked}
                                onDragStart={() => handleDragStart(posIndex)}
                                onDragOver={(e) => handleDragOver(e, posIndex)}
                                onDrop={() => handleDrop(posIndex)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleRemoveFromSentence(posIndex)}
                                className={`text-sm transition-all select-none ${
                                    !checked ? 'cursor-grab active:cursor-grabbing hover:bg-primary/80' : ''
                                } ${dragOverIndex === posIndex ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                            >
                                {exercise.words[wordIndex]}
                            </Badge>
                        ))
                    )}
                </div>

                {/* Feedback */}
                {checked && (
                    <p className={`text-sm font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isCorrect ? 'Richtig!' : `Falsch. Richtige Antwort: ${exercise.correct}`}
                    </p>
                )}

                {/* Available words */}
                <div className="flex flex-wrap gap-2">
                    {availableIndices.map((wordIndex) => (
                        <Badge
                            key={wordIndex}
                            variant="outline"
                            className="cursor-pointer hover:bg-accent text-sm px-3 py-1"
                            onClick={() => handleSelect(wordIndex)}
                        >
                            {exercise.words[wordIndex]}
                        </Badge>
                    ))}
                </div>

                {!checked && selected.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                        Tipp: Ziehe Wörter oben per Drag & Drop um, oder klicke zum Entfernen.
                    </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {!checked ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                                disabled={selected.length === 0}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Zurücksetzen
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setChecked(true)}
                                disabled={selected.length !== exercise.words.length}
                            >
                                Prüfen
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" onClick={handleReset}>
                                <RotateCcw className="h-4 w-4" />
                                Nochmal
                            </Button>
                            {onNext && (
                                <Button size="sm" onClick={onNext}>
                                    Nächste Übung
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
