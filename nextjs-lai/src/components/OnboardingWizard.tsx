'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Progress } from '@/src/components/ui/progress'
import { Badge } from '@/src/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import {
    Sparkles,
    Upload,
    HelpCircle,
    CheckCircle2,
    Loader2,
    ArrowRight,
    XCircle,
} from 'lucide-react'
import { generateQuiz, evaluateAnswer } from '@/src/actions/quiz'

const STORAGE_KEY_COMPLETED = 'lai_onboarding_completed'
const STORAGE_KEY_STEP = 'lai_onboarding_step'
const STORAGE_KEY_DOC_ID = 'lai_onboarding_doc_id'

const STEPS = [
    { label: 'Willkommen', icon: Sparkles },
    { label: 'Lernmaterial', icon: Upload },
    { label: 'Quiz testen', icon: HelpCircle },
    { label: 'Fertig', icon: CheckCircle2 },
]

interface QuizQuestion {
    id: string
    questionText: string
    options: string[] | null
    questionIndex: number
    questionType?: string
}

interface OnboardingWizardProps {
    onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const router = useRouter()
    const [open, setOpen] = useState(true)
    const [step, setStep] = useState(() => {
        if (typeof window === 'undefined') return 0
        const saved = localStorage.getItem(STORAGE_KEY_STEP)
        return saved ? parseInt(saved, 10) : 0
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [documentId, setDocumentId] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(STORAGE_KEY_DOC_ID)
    })

    // Quiz state
    const [questions, setQuestions] = useState<QuizQuestion[]>([])
    const [currentQ, setCurrentQ] = useState(0)
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [quizResult, setQuizResult] = useState<{ isCorrect: boolean; explanation?: string } | null>(null)
    const [quizScore, setQuizScore] = useState(0)
    const [quizDone, setQuizDone] = useState(false)

    // Persist step
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_STEP, String(step))
    }, [step])

    const markComplete = useCallback(() => {
        localStorage.setItem(STORAGE_KEY_COMPLETED, 'true')
        localStorage.removeItem(STORAGE_KEY_STEP)
        localStorage.removeItem(STORAGE_KEY_DOC_ID)
        setOpen(false)
        onComplete()
        router.refresh()
    }, [onComplete, router])

    function handleSkip() {
        markComplete()
    }

    // Step 2: Upload seed document
    async function handleUploadSeed() {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/seed/example-document.md')
            const text = await res.text()

            const uploadRes = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Lernmethoden und Gedächtnistechniken',
                    text,
                    subject: 'Lernpsychologie',
                }),
            })

            // Parse SSE stream for the document ID
            const reader = uploadRes.body?.getReader()
            const decoder = new TextDecoder()
            let docId: string | null = null

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    const chunk = decoder.decode(value, { stream: true })
                    const lines = chunk.split('\n')
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6))
                                if (data.type === 'complete' && data.documentId) {
                                    docId = data.documentId
                                }
                                if (data.type === 'error') {
                                    throw new Error(data.error)
                                }
                            } catch {
                                // skip non-JSON lines
                            }
                        }
                    }
                }
            }

            if (!docId) throw new Error('Lernmaterial konnte nicht erstellt werden.')

            setDocumentId(docId)
            localStorage.setItem(STORAGE_KEY_DOC_ID, docId)
            setStep(2)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Fehler beim Laden des Beispiels.')
        } finally {
            setLoading(false)
        }
    }

    // Step 3: Generate mini quiz
    async function handleGenerateQuiz() {
        if (!documentId) return
        setLoading(true)
        setError(null)
        try {
            const { quizId } = await generateQuiz(documentId, 3, ['singleChoice'])
            // Fetch quiz questions
            const { getQuiz } = await import('@/src/actions/quiz')
            const quiz = await getQuiz(quizId)
            if (!quiz) throw new Error('Quiz konnte nicht geladen werden.')
            setQuestions(quiz.questions as QuizQuestion[])
            setCurrentQ(0)
            setSelectedIndex(null)
            setQuizResult(null)
            setQuizScore(0)
            setQuizDone(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Quiz.')
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmitAnswer() {
        if (selectedIndex === null || !questions[currentQ]) return
        setLoading(true)
        try {
            const result = await evaluateAnswer(questions[currentQ].id, selectedIndex)
            const res = result as { isCorrect: boolean; explanation?: string }
            setQuizResult(res)
            if (res.isCorrect) setQuizScore((s) => s + 1)
        } catch {
            // ignore
        } finally {
            setLoading(false)
        }
    }

    function handleNextQuestion() {
        if (currentQ < questions.length - 1) {
            setCurrentQ((i) => i + 1)
            setSelectedIndex(null)
            setQuizResult(null)
        } else {
            setQuizDone(true)
        }
    }

    const progressPercent = ((step + 1) / STEPS.length) * 100

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip() }}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {(() => {
                            const StepIcon = STEPS[step].icon
                            return <StepIcon className="h-5 w-5 text-primary" />
                        })()}
                        {STEPS[step].label}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Onboarding Schritt {step + 1} von {STEPS.length}
                    </DialogDescription>
                </DialogHeader>

                {/* Stepper */}
                <div className="space-y-3">
                    <Progress value={progressPercent} className="h-1.5" />
                    <div className="flex justify-between">
                        {STEPS.map((s, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <div
                                    className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                                        i < step ? 'bg-primary text-primary-foreground' :
                                        i === step ? 'bg-primary text-primary-foreground' :
                                        'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                                </div>
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive p-3 rounded-lg bg-destructive/10">
                        <XCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Step content */}
                <div className="space-y-4 py-2">
                    {step === 0 && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Willkommen bei <strong>LAI</strong> — deiner KI-gestützten Lernplattform!
                            </p>
                            <p className="text-sm text-muted-foreground">
                                In wenigen Schritten zeigen wir dir, wie du mit LAI effektiver lernst:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-2 ml-1">
                                <li className="flex items-center gap-2">
                                    <Upload className="h-4 w-4 text-primary shrink-0" />
                                    Lernmaterial hochladen und verarbeiten lassen
                                </li>
                                <li className="flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                                    Dein Wissen mit KI-generierten Quizfragen testen
                                </li>
                            </ul>
                            <Button onClick={() => setStep(1)} className="w-full">
                                Los geht&apos;s
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <p className="text-sm text-muted-foreground">
                                Wir laden ein Beispiel-Lernmaterial über <strong>Lernmethoden und Gedächtnistechniken</strong> für dich.
                                Damit kannst du alle Funktionen direkt ausprobieren.
                            </p>
                            {documentId ? (
                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Beispiel-Dokument wurde geladen!
                                    <Button size="sm" variant="outline" onClick={() => setStep(2)}>
                                        Weiter
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleUploadSeed}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Wird geladen...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Beispiel laden
                                        </>
                                    )}
                                </Button>
                            )}
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {questions.length === 0 && !loading && (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Jetzt erstellen wir ein kurzes Quiz mit 3 Fragen aus dem Beispiel-Dokument.
                                        So siehst du, wie das Lernen mit LAI funktioniert.
                                    </p>
                                    <Button
                                        onClick={handleGenerateQuiz}
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        <HelpCircle className="h-4 w-4" />
                                        Mini-Quiz starten
                                    </Button>
                                </>
                            )}

                            {loading && questions.length === 0 && (
                                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Quiz wird generiert...
                                </div>
                            )}

                            {questions.length > 0 && !quizDone && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline">
                                            Frage {currentQ + 1} von {questions.length}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-medium">
                                        {questions[currentQ].questionText}
                                    </p>

                                    {questions[currentQ].options && (
                                        <RadioGroup
                                            value={selectedIndex !== null ? String(selectedIndex) : ''}
                                            onValueChange={(v) => {
                                                if (!quizResult) setSelectedIndex(Number(v))
                                            }}
                                            disabled={!!quizResult}
                                        >
                                            {(questions[currentQ].options as string[]).map((opt, i) => {
                                                let itemClass = ''
                                                if (quizResult) {
                                                    const res = quizResult as { isCorrect: boolean; correctIndex?: number }
                                                    if (res.correctIndex !== undefined) {
                                                        if (i === res.correctIndex) {
                                                            itemClass = 'border-green-500 bg-green-50 dark:bg-green-950'
                                                        } else if (i === selectedIndex && !res.isCorrect) {
                                                            itemClass = 'border-red-500 bg-red-50 dark:bg-red-950'
                                                        }
                                                    }
                                                }
                                                return (
                                                    <label
                                                        key={i}
                                                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent text-sm ${itemClass}`}
                                                    >
                                                        <RadioGroupItem value={String(i)} />
                                                        {opt}
                                                    </label>
                                                )
                                            })}
                                        </RadioGroup>
                                    )}

                                    {quizResult && quizResult.explanation && (
                                        <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                            {quizResult.explanation}
                                        </p>
                                    )}

                                    {!quizResult ? (
                                        <Button
                                            onClick={handleSubmitAnswer}
                                            disabled={selectedIndex === null || loading}
                                            className="w-full"
                                        >
                                            {loading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                'Antwort prüfen'
                                            )}
                                        </Button>
                                    ) : (
                                        <Button onClick={handleNextQuestion} className="w-full">
                                            {currentQ < questions.length - 1 ? (
                                                <>Nächste Frage <ArrowRight className="h-4 w-4" /></>
                                            ) : (
                                                'Ergebnis anzeigen'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {quizDone && (
                                <div className="text-center space-y-3 py-2">
                                    <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
                                    <p className="text-sm font-medium">
                                        {quizScore} von {questions.length} richtig!
                                    </p>
                                    <Button onClick={() => setStep(3)} className="w-full">
                                        Weiter
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-4 py-2">
                            <div className="flex justify-center">
                                <div className="p-4 rounded-full bg-green-100 dark:bg-green-950">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Alles eingerichtet!</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Du kannst jetzt eigene Lernmaterialien hochladen, Quizze erstellen
                                    und mit Karteikarten lernen.
                                </p>
                            </div>
                            <Button onClick={markComplete} className="w-full">
                                Zum Dashboard
                            </Button>
                        </div>
                    )}
                </div>

                {/* Skip button */}
                {step < 3 && (
                    <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={handleSkip}>
                            Überspringen
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
