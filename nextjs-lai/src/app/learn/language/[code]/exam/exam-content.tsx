'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    GraduationCap,
    Clock,
    Pause,
    Play,
    BookOpen,
    Headphones,
    PenLine,
    Languages,
    CheckCircle2,
    XCircle,
    Trophy,
    ChevronRight,
    AlertTriangle,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/src/components/ui/radio-group'
import { Textarea } from '@/src/components/ui/textarea'
import { useLearningSession } from '@/src/hooks/use-learning-session'
import { cn } from '@/src/lib/utils'
import { getExamsForLanguage, type ExamTemplate, type ExamSection, type ExamQuestion } from './exam-data'

// ── Result types ───────────────────────────────────────────────────────

interface ExamResults {
    sections: Array<{
        sectionId: string
        score: number
        maxScore: number
        timeUsed: number
        answers: Array<{ questionId: string; answer: string; isCorrect: boolean }>
    }>
    totalScore: number
    maxTotalScore: number
    passed: boolean
    totalTimeUsed: number
}

// ── Props ──────────────────────────────────────────────────────────────

interface ExamContentProps {
    languageCode: string
    languageName: string
}

// Section type icon mapping
const SECTION_TYPE_ICONS: Record<string, React.ReactNode> = {
    reading: <BookOpen className="h-4 w-4" />,
    listening: <Headphones className="h-4 w-4" />,
    writing: <PenLine className="h-4 w-4" />,
    grammar: <Languages className="h-4 w-4" />,
}

// ── Main component ─────────────────────────────────────────────────────

type Phase = 'selection' | 'confirm' | 'exam' | 'results'

export function ExamContent({ languageCode, languageName }: ExamContentProps) {
    useLearningSession('exam')

    const [phase, setPhase] = useState<Phase>('selection')
    const [selectedExam, setSelectedExam] = useState<ExamTemplate | null>(null)
    const [results, setResults] = useState<ExamResults | null>(null)

    const availableExams = getExamsForLanguage(languageCode)

    function handleSelectExam(exam: ExamTemplate) {
        setSelectedExam(exam)
        setPhase('confirm')
    }

    function handleStartExam() {
        setPhase('exam')
    }

    function handleExamComplete(examResults: ExamResults) {
        setResults(examResults)
        setPhase('results')
    }

    function handleRetry() {
        setResults(null)
        setPhase('confirm')
    }

    function handleBackToSelection() {
        setSelectedExam(null)
        setResults(null)
        setPhase('selection')
    }

    // ── Selection phase ────────────────────────────────────────────────

    if (phase === 'selection') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/learn/language/${languageCode}`}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <h1 className="text-xl font-bold">Prüfungsmodus &mdash; {languageName}</h1>
                    </div>
                </div>

                <p className="text-muted-foreground">
                    Wähle eine Prüfung aus, um eine realistische Prüfungssimulation zu starten.
                    Die Zeit läuft ab dem Start &mdash; genau wie bei einer echten Prüfung.
                </p>

                {availableExams.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                Für diese Sprache sind noch keine Prüfungen verfügbar.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {availableExams.map((exam) => (
                            <Card
                                key={exam.id}
                                className="cursor-pointer transition-shadow hover:shadow-md"
                                onClick={() => handleSelectExam(exam)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{exam.name}</CardTitle>
                                        <Badge variant="outline">{exam.level}</Badge>
                                    </div>
                                    <CardDescription className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {exam.totalTimeMinutes} Minuten
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {exam.sections.map((section) => (
                                            <div
                                                key={section.id}
                                                className="flex items-center gap-1 text-xs text-muted-foreground"
                                            >
                                                {SECTION_TYPE_ICONS[section.type]}
                                                <span>{section.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <p className="text-xs text-muted-foreground">
                                        {exam.sections.length} Abschnitte &middot; Mindestens {exam.passingPercentage}% zum Bestehen
                                    </p>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // ── Confirmation phase ─────────────────────────────────────────────

    if (phase === 'confirm' && selectedExam) {
        const totalQuestions = selectedExam.sections.reduce((sum, s) => sum + s.questions.length, 0)
        const totalPoints = selectedExam.sections.reduce(
            (sum, s) => sum + s.questions.reduce((qs, q) => qs + q.points, 0), 0
        )

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleBackToSelection}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <h1 className="text-xl font-bold">{selectedExam.name}</h1>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Prüfungsübersicht</CardTitle>
                        <CardDescription>
                            Bitte lies die folgenden Informationen sorgfältig durch, bevor du die Prüfung startest.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-2xl font-bold">{selectedExam.totalTimeMinutes}</p>
                                <p className="text-xs text-muted-foreground">Minuten</p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-2xl font-bold">{selectedExam.sections.length}</p>
                                <p className="text-xs text-muted-foreground">Abschnitte</p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-2xl font-bold">{totalQuestions}</p>
                                <p className="text-xs text-muted-foreground">Aufgaben</p>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <p className="text-2xl font-bold">{totalPoints}</p>
                                <p className="text-xs text-muted-foreground">Punkte</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Abschnitte</h3>
                            {selectedExam.sections.map((section) => (
                                <div
                                    key={section.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="flex items-center gap-2">
                                        {SECTION_TYPE_ICONS[section.type]}
                                        <span className="text-sm font-medium">{section.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>{section.questions.length} Aufgaben</span>
                                        <span>{section.timeMinutes} Min.</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4 text-sm">
                            <p className="font-medium text-amber-800 dark:text-amber-200">Hinweis:</p>
                            <ul className="mt-1 space-y-1 text-amber-700 dark:text-amber-300">
                                <li>Die Prüfung beginnt sofort nach dem Start.</li>
                                <li>Du kannst nicht zu vorherigen Abschnitten zurückkehren.</li>
                                <li>Wenn die Zeit abläuft, wird die Prüfung automatisch beendet.</li>
                                <li>Du brauchst mindestens {selectedExam.passingPercentage}% zum Bestehen.</li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={handleBackToSelection}>
                            Zurück zur Auswahl
                        </Button>
                        <Button size="lg" onClick={handleStartExam}>
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Prüfung starten
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // ── Exam phase ─────────────────────────────────────────────────────

    if (phase === 'exam' && selectedExam) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>{selectedExam.name} &mdash; {selectedExam.level}</span>
                </div>
                <SimExamPlayer
                    examTitle={selectedExam.name}
                    sections={selectedExam.sections}
                    totalTimeMinutes={selectedExam.totalTimeMinutes}
                    passingPercentage={selectedExam.passingPercentage}
                    onComplete={handleExamComplete}
                />
            </div>
        )
    }

    // ── Results phase ──────────────────────────────────────────────────

    if (phase === 'results' && results && selectedExam) {
        const percentage = results.maxTotalScore > 0
            ? Math.round((results.totalScore / results.maxTotalScore) * 100)
            : 0
        const totalMinutesUsed = Math.floor(results.totalTimeUsed / 60)
        const totalSecondsUsed = results.totalTimeUsed % 60

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleBackToSelection}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <h1 className="text-xl font-bold">Ergebnis &mdash; {selectedExam.name}</h1>
                    </div>
                </div>

                {/* Overall result card */}
                <Card className={results.passed
                    ? 'border-green-300 dark:border-green-800'
                    : 'border-red-300 dark:border-red-800'
                }>
                    <CardContent className="py-8 text-center space-y-4">
                        {results.passed ? (
                            <div className="flex flex-col items-center gap-3">
                                <Trophy className="h-12 w-12 text-green-600 dark:text-green-400" />
                                <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    Bestanden!
                                </h2>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                                <h2 className="text-2xl font-bold text-red-700 dark:text-red-300">
                                    Nicht bestanden
                                </h2>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-8">
                            <div>
                                <p className="text-4xl font-bold">{percentage}%</p>
                                <p className="text-sm text-muted-foreground">Gesamtergebnis</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold">{results.totalScore}/{results.maxTotalScore}</p>
                                <p className="text-sm text-muted-foreground">Punkte</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold">
                                    {totalMinutesUsed}:{String(totalSecondsUsed).padStart(2, '0')}
                                </p>
                                <p className="text-sm text-muted-foreground">Benötigte Zeit</p>
                            </div>
                        </div>

                        <Progress
                            value={percentage}
                            className={results.passed
                                ? '[&>[data-slot=progress-indicator]]:bg-green-600'
                                : '[&>[data-slot=progress-indicator]]:bg-red-600'
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Zum Bestehen benötigt: {selectedExam.passingPercentage}%
                        </p>
                    </CardContent>
                </Card>

                {/* Section-by-section breakdown */}
                <h3 className="text-lg font-semibold">Ergebnisse nach Abschnitt</h3>
                <div className="space-y-4">
                    {results.sections.map((sectionResult, idx) => {
                        const section = selectedExam.sections[idx]
                        const sectionPct = sectionResult.maxScore > 0
                            ? Math.round((sectionResult.score / sectionResult.maxScore) * 100)
                            : 0
                        const sectionMinutes = Math.floor(sectionResult.timeUsed / 60)
                        const sectionSeconds = sectionResult.timeUsed % 60

                        return (
                            <Card key={sectionResult.sectionId}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {SECTION_TYPE_ICONS[section.type]}
                                            {section.title}
                                        </CardTitle>
                                        <Badge
                                            variant={sectionPct >= selectedExam.passingPercentage ? 'default' : 'destructive'}
                                        >
                                            {sectionPct}%
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>{sectionResult.score}/{sectionResult.maxScore} Punkte</span>
                                        <span className="text-muted-foreground">
                                            Zeit: {sectionMinutes}:{String(sectionSeconds).padStart(2, '0')}
                                        </span>
                                    </div>
                                    <Progress value={sectionPct} />

                                    {/* Individual answer review */}
                                    <div className="space-y-2 pt-2">
                                        {sectionResult.answers.map((ans, aIdx) => {
                                            const question = section.questions[aIdx]
                                            return (
                                                <div
                                                    key={ans.questionId}
                                                    className="flex items-start gap-2 text-sm"
                                                >
                                                    {ans.isCorrect ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="text-muted-foreground line-clamp-1">
                                                            {question.prompt}
                                                        </p>
                                                        {!ans.isCorrect && question.correctIndex !== undefined && question.options && (
                                                            <p className="text-xs text-green-600 dark:text-green-400">
                                                                Richtige Antwort: {question.options[question.correctIndex]}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-4">
                    <Button variant="outline" asChild>
                        <Link href={`/learn/language/${languageCode}`}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Zurück zur Übersicht
                        </Link>
                    </Button>
                    <Button onClick={handleRetry}>
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Prüfung wiederholen
                    </Button>
                </div>
            </div>
        )
    }

    return null
}

// ── Countdown timer (inline) ───────────────────────────────────────────

function SimTimer({ totalMinutes, onTimeUp }: { totalMinutes: number; onTimeUp: () => void }) {
    const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60)
    const [paused, setPaused] = useState(false)
    const onTimeUpRef = useRef(onTimeUp)
    onTimeUpRef.current = onTimeUp

    useEffect(() => {
        if (paused || secondsLeft <= 0) return
        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval)
                    onTimeUpRef.current()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [paused, secondsLeft])

    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    const isWarning = secondsLeft <= 300 && secondsLeft > 60
    const isCritical = secondsLeft <= 60

    return (
        <div
            className={cn(
                'sticky top-0 z-50 flex items-center justify-between px-4 py-2 rounded-lg border backdrop-blur-sm transition-colors',
                isCritical
                    ? 'bg-red-50/95 dark:bg-red-950/95 border-red-300 dark:border-red-800'
                    : isWarning
                        ? 'bg-amber-50/95 dark:bg-amber-950/95 border-amber-300 dark:border-amber-800'
                        : 'bg-background/95 border-border'
            )}
        >
            <div className="flex items-center gap-2">
                {isCritical ? (
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 animate-pulse" />
                ) : (
                    <Clock className={cn(
                        'h-4 w-4',
                        isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                    )} />
                )}
                <span
                    className={cn(
                        'font-mono text-lg font-bold tabular-nums',
                        isCritical
                            ? 'text-red-600 dark:text-red-400 animate-pulse'
                            : isWarning
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-foreground'
                    )}
                >
                    {timeString}
                </span>
                {paused && (
                    <span className="text-xs text-muted-foreground">(Pausiert)</span>
                )}
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setPaused((p) => !p)}
                className="h-8 w-8 p-0"
            >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
        </div>
    )
}

// ── Exam simulation player (inline) ────────────────────────────────────

interface SimExamPlayerProps {
    examTitle: string
    sections: ExamSection[]
    totalTimeMinutes: number
    passingPercentage: number
    onComplete: (results: ExamResults) => void
}

function SimExamPlayer({
    sections,
    totalTimeMinutes,
    passingPercentage,
    onComplete,
}: SimExamPlayerProps) {
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
    const [answers, setAnswers] = useState<Map<string, string>>(new Map())
    const [completedSections, setCompletedSections] = useState<Set<number>>(new Set())
    const [timedOut, setTimedOut] = useState(false)
    const sectionStartRef = useRef<number>(Date.now())
    const sectionTimesRef = useRef<Map<number, number>>(new Map())

    const currentSection = sections[currentSectionIndex]
    const isLastSection = currentSectionIndex === sections.length - 1

    useEffect(() => {
        sectionStartRef.current = Date.now()
    }, [currentSectionIndex])

    const recordSectionTime = useCallback(() => {
        const elapsed = Math.round((Date.now() - sectionStartRef.current) / 1000)
        const existing = sectionTimesRef.current.get(currentSectionIndex) ?? 0
        sectionTimesRef.current.set(currentSectionIndex, existing + elapsed)
    }, [currentSectionIndex])

    function scoreQuestion(question: ExamQuestion, answer: string): boolean {
        if (question.type === 'freeText') return answer.trim().length > 10
        if (question.type === 'multipleChoice' || question.type === 'trueFalse') {
            return parseInt(answer, 10) === question.correctIndex
        }
        if (question.type === 'cloze') {
            if (question.options && question.correctIndex !== undefined) {
                return parseInt(answer, 10) === question.correctIndex
            }
            return answer.trim().toLowerCase() === question.correctAnswer?.toLowerCase()
        }
        return false
    }

    const buildResults = useCallback((): ExamResults => {
        let totalScore = 0
        let maxTotalScore = 0
        let totalTimeUsed = 0

        const sectionResults = sections.map((section, idx) => {
            const sectionAnswers: Array<{ questionId: string; answer: string; isCorrect: boolean }> = []
            let sectionScore = 0
            let maxScore = 0
            for (const question of section.questions) {
                const answer = answers.get(question.id) ?? ''
                const isCorrect = scoreQuestion(question, answer)
                if (isCorrect) sectionScore += question.points
                maxScore += question.points
                sectionAnswers.push({ questionId: question.id, answer, isCorrect })
            }
            const timeUsed = sectionTimesRef.current.get(idx) ?? 0
            totalScore += sectionScore
            maxTotalScore += maxScore
            totalTimeUsed += timeUsed
            return { sectionId: section.id, score: sectionScore, maxScore, timeUsed, answers: sectionAnswers }
        })

        const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0
        return {
            sections: sectionResults,
            totalScore,
            maxTotalScore,
            passed: percentage >= passingPercentage,
            totalTimeUsed,
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sections, answers, passingPercentage])

    const handleTimeUp = useCallback(() => {
        setTimedOut(true)
        const elapsed = Math.round((Date.now() - sectionStartRef.current) / 1000)
        const existing = sectionTimesRef.current.get(currentSectionIndex) ?? 0
        sectionTimesRef.current.set(currentSectionIndex, existing + elapsed)
    }, [currentSectionIndex])

    useEffect(() => {
        if (timedOut) onComplete(buildResults())
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timedOut])

    function handleAnswerChange(questionId: string, value: string) {
        setAnswers((prev) => {
            const next = new Map(prev)
            next.set(questionId, value)
            return next
        })
    }

    function handleFinishSection() {
        recordSectionTime()
        const newCompleted = new Set(completedSections)
        newCompleted.add(currentSectionIndex)
        setCompletedSections(newCompleted)
        if (isLastSection) {
            onComplete(buildResults())
        } else {
            setCurrentSectionIndex((prev) => prev + 1)
        }
    }

    const answeredInSection = currentSection.questions.filter(
        (q) => answers.has(q.id) && answers.get(q.id)!.trim() !== ''
    ).length
    const sectionProgress = (answeredInSection / currentSection.questions.length) * 100

    return (
        <div className="space-y-4">
            <SimTimer totalMinutes={totalTimeMinutes} onTimeUp={handleTimeUp} />

            {/* Section navigation pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {sections.map((section, idx) => {
                    const isDone = completedSections.has(idx)
                    const isCurrent = idx === currentSectionIndex
                    return (
                        <div
                            key={section.id}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors',
                                isCurrent
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : isDone
                                        ? 'bg-muted text-muted-foreground border-border'
                                        : 'bg-background text-muted-foreground/60 border-border/50'
                            )}
                        >
                            {isDone ? <CheckCircle2 className="h-3 w-3" /> : SECTION_TYPE_ICONS[section.type]}
                            <span>{section.title}</span>
                        </div>
                    )
                })}
            </div>

            {/* Section header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        {SECTION_TYPE_ICONS[currentSection.type]}
                        {currentSection.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {currentSection.timeMinutes} Minuten &mdash; {currentSection.questions.length} Aufgaben
                    </p>
                </div>
                <Badge variant="outline">
                    Abschnitt {currentSectionIndex + 1} von {sections.length}
                </Badge>
            </div>

            <Progress value={sectionProgress} />
            <p className="text-xs text-muted-foreground text-right">
                {answeredInSection} von {currentSection.questions.length} beantwortet
            </p>

            {/* Questions */}
            <div className="space-y-6">
                {currentSection.questions.map((question, qIdx) => (
                    <SimQuestionCard
                        key={question.id}
                        question={question}
                        index={qIdx}
                        answer={answers.get(question.id) ?? ''}
                        onAnswerChange={(value) => handleAnswerChange(question.id, value)}
                    />
                ))}
            </div>

            {/* Finish section button */}
            <div className="flex justify-end pt-4">
                <Button onClick={handleFinishSection} size="lg">
                    {isLastSection ? 'Prüfung abschließen' : 'Abschnitt beenden'}
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    )
}

// ── Question card (inline) ─────────────────────────────────────────────

function SimQuestionCard({
    question,
    index,
    answer,
    onAnswerChange,
}: {
    question: ExamQuestion
    index: number
    answer: string
    onAnswerChange: (value: string) => void
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">
                    <span className="text-muted-foreground mr-2">{index + 1}.</span>
                    {question.prompt}
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        {question.points} {question.points === 1 ? 'Punkt' : 'Punkte'}
                    </Badge>
                </div>
            </CardHeader>

            {question.passage && (
                <CardContent className="pt-0">
                    <div className="rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-wrap border">
                        {question.passage}
                    </div>
                </CardContent>
            )}

            <CardFooter className="flex flex-col items-stretch gap-3">
                {/* Multiple choice / True-False / Cloze with options */}
                {(question.type === 'multipleChoice' || question.type === 'trueFalse' ||
                    (question.type === 'cloze' && question.options)) && question.options && (
                    <RadioGroup value={answer} onValueChange={onAnswerChange}>
                        {question.options.map((option, i) => (
                            <label
                                key={i}
                                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent"
                            >
                                <RadioGroupItem value={String(i)} />
                                <span className="text-sm">{option}</span>
                            </label>
                        ))}
                    </RadioGroup>
                )}

                {/* Free text (writing) */}
                {question.type === 'freeText' && (
                    <div className="space-y-2 w-full">
                        <Textarea
                            value={answer}
                            onChange={(e) => onAnswerChange(e.target.value)}
                            placeholder="Schreibe deine Antwort hier..."
                            maxLength={2000}
                            rows={6}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {answer.length}/2000
                        </p>
                    </div>
                )}

                {/* Cloze without options (text input) */}
                {question.type === 'cloze' && !question.options && (
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => onAnswerChange(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-input bg-transparent text-sm outline-none focus:border-primary"
                        placeholder="Deine Antwort..."
                        maxLength={200}
                    />
                )}
            </CardFooter>
        </Card>
    )
}
