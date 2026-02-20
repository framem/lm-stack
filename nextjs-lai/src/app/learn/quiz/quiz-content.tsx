'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { HelpCircle, Loader2, FileText, TrendingUp, Plus } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Progress } from '@/src/components/ui/progress'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/ui/select'
import { Switch } from '@/src/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/src/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/src/components/ui/alert-dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/src/components/ui/tooltip'
import { QuizCard } from '@/src/components/QuizCard'
import { getQuizzes, deleteQuiz, getDocumentProgress, getRecommendedQuizDifficulty } from '@/src/actions/quiz'
import { DIFFICULTY_LEVELS } from '@/src/lib/quiz-difficulty'
import { getDocuments, getSubjects } from '@/src/actions/documents'
import { listGeneratedScenarios } from '@/src/actions/generated-scenarios'
import { getLearningGoals } from '@/src/actions/learning-goal'
import { formatDate } from '@/src/lib/utils'
import { isFreetextLikeType } from '@/src/lib/quiz-types'
import { SCENARIOS, LANGUAGE_LABELS, type Language } from '@/src/lib/conversation-scenarios-constants'

interface Document {
    id: string
    title: string
    fileType: string
    subject?: string | null
}

interface DocumentProgressItem {
    documentId: string
    documentTitle: string
    totalQuestions: number
    answeredQuestions: number
    correctScore: number
    percentage: number
    lastAttemptAt: string | null
}

interface Quiz {
    id: string
    title: string
    createdAt: string | Date
    document: { id: string; title: string } | null
    questions: {
        id: string
        questionType: string
        attempts: {
            isCorrect: boolean
            freeTextScore: number | null
            createdAt: string | Date
        }[]
    }[]
}

// Derive numeric difficulty from CEFR level string
function cefrToDifficulty(cefr: string): 1 | 2 | 3 {
    const upper = cefr.toUpperCase()
    if (upper === 'A1' || upper === 'A1-A2' || upper === 'A2') return 1
    if (upper === 'A2-B1' || upper === 'B1') return 2
    return 3
}

interface ScenarioOption {
    key: string
    icon: string
    title: string
    description: string
    difficulty: string
    isGenerated?: boolean
}

// Compute last attempt stats for a quiz
function getLastAttemptStats(questions: Quiz['questions']) {
    const answered = questions.filter((q) => q.attempts.length > 0)
    if (answered.length === 0) return null

    let score = 0
    let lastDate: Date | null = null
    for (const q of answered) {
        const a = q.attempts[0]
        score += isFreetextLikeType(q.questionType)
            ? (a.freeTextScore ?? (a.isCorrect ? 1 : 0))
            : (a.isCorrect ? 1 : 0)
        const d = new Date(a.createdAt)
        if (!lastDate || d > lastDate) lastDate = d
    }

    return {
        percentage: Math.round((score / answered.length) * 100),
        lastAttemptAt: lastDate!.toISOString(),
    }
}

const QUESTION_TYPES = [
    { value: 'singleChoice', label: 'Single Choice' },
    { value: 'multipleChoice', label: 'Multiple Choice' },
    { value: 'freetext', label: 'Freitext' },
    { value: 'truefalse', label: 'Wahr/Falsch' },
    { value: 'cloze', label: 'Lückentext' },
    { value: 'fillInBlanks', label: 'Lückentext (mehrfach)' },
    { value: 'conjugation', label: 'Konjugation' },
    { value: 'sentenceOrder', label: 'Satzordnung' },
] as const

export function QuizContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [documents, setDocuments] = useState<Document[]>([])
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [progress, setProgress] = useState<DocumentProgressItem[]>([])
    const [loading, setLoading] = useState(true)
    const [subjects, setSubjects] = useState<string[]>([])
    const [activeSubject, setActiveSubject] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>(
        searchParams.get('documentId') ? [searchParams.get('documentId')!] : []
    )
    const [generating, setGenerating] = useState(false)
    const [generatedCount, setGeneratedCount] = useState(0)
    const [questionCount, setQuestionCount] = useState(5)
    const [questionTypes, setQuestionTypes] = useState<string[]>(QUESTION_TYPES.map(t => t.value))
    const [difficulty, setDifficulty] = useState(1)
    const [recommendedDifficulty, setRecommendedDifficulty] = useState<number | null>(null)
    const [examMode, setExamMode] = useState(false)
    const [examTimeLimit, setExamTimeLimit] = useState(30)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

    // Scenario source state
    const [sourceMode, setSourceMode] = useState<'document' | 'scenario'>('document')
    const [scenarioLanguage, setScenarioLanguage] = useState<Language>('de')
    const [scenarioOptions, setScenarioOptions] = useState<ScenarioOption[]>([])
    const [selectedScenario, setSelectedScenario] = useState<ScenarioOption | null>(null)
    const [learningGoals, setLearningGoals] = useState<{ language: string; targetLevel: string }[]>([])

    useEffect(() => {
        async function load() {
            try {
                const [docs, quizList, progressData, subjectList, goals] = await Promise.all([
                    getDocuments(),
                    getQuizzes(),
                    getDocumentProgress(),
                    getSubjects(),
                    getLearningGoals(),
                ])
                const typedDocs = docs as unknown as Document[]
                setDocuments(typedDocs)
                setQuizzes(quizList as Quiz[])
                setProgress(progressData as unknown as DocumentProgressItem[])
                setSubjects(subjectList)
                setLearningGoals(goals.map(g => ({ language: g.language, targetLevel: g.targetLevel })))

                // Pre-select when only one document exists
                if (typedDocs.length === 1 && !searchParams.get('documentId')) {
                    setSelectedDocIds([typedDocs[0].id])
                }
            } catch (error) {
                console.error('Failed to load data:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [searchParams])

    // Load scenario options when source mode or language changes
    useEffect(() => {
        if (sourceMode !== 'scenario') return
        async function loadScenarios() {
            try {
                const generated = await listGeneratedScenarios(scenarioLanguage)
                const staticOptions: ScenarioOption[] = SCENARIOS.map(s => {
                    const t = s.translations[scenarioLanguage] ?? s.translations['de']
                    return {
                        key: s.key,
                        icon: s.icon,
                        title: t.title,
                        description: t.description,
                        difficulty: s.difficulty,
                    }
                })
                const generatedOptions: ScenarioOption[] = generated.map(s => ({
                    key: s.key,
                    icon: s.icon,
                    title: s.title,
                    description: s.description,
                    difficulty: s.difficulty,
                    isGenerated: true,
                }))
                setScenarioOptions([...staticOptions, ...generatedOptions])
                setSelectedScenario(null)
            } catch (error) {
                console.error('Failed to load scenarios:', error)
            }
        }
        loadScenarios()
    }, [sourceMode, scenarioLanguage])

    // Auto-recommend difficulty when selected documents change
    useEffect(() => {
        if (selectedDocIds.length === 0) {
            setRecommendedDifficulty(null)
            return
        }
        getRecommendedQuizDifficulty(selectedDocIds).then((rec) => {
            setRecommendedDifficulty(rec)
            setDifficulty(rec)
        }).catch(() => {})
    }, [selectedDocIds])

    function toggleQuestionType(type: string) {
        setQuestionTypes((prev) =>
            prev.includes(type)
                ? prev.filter((t) => t !== type)
                : [...prev, type]
        )
    }

    async function handleGenerate() {
        if (sourceMode === 'document' && selectedDocIds.length === 0) return
        if (sourceMode === 'scenario' && !selectedScenario) return
        setGenerating(true)
        setGeneratedCount(0)
        try {
            const body = sourceMode === 'scenario'
                ? {
                    scenarioKey: selectedScenario!.key,
                    language: scenarioLanguage,
                    questionCount,
                    questionTypes,
                    difficulty: cefrToDifficulty(selectedScenario!.difficulty),
                }
                : {
                    documentIds: selectedDocIds,
                    questionCount,
                    questionTypes,
                    difficulty,
                }
            const res = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (!res.ok || !res.body) {
                throw new Error('Fehler bei der Quiz-Erstellung')
            }

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const event = JSON.parse(line.slice(6))

                    if (event.type === 'progress') {
                        setGeneratedCount(event.generated)
                    } else if (event.type === 'complete') {
                        const url = examMode
                            ? `/learn/quiz/${event.quizId}?mode=exam&timeLimit=${examTimeLimit}`
                            : `/learn/quiz/${event.quizId}`

                        // Reload quiz list
                        getQuizzes().then((list) => setQuizzes(list as Quiz[])).catch(console.error)

                        // Close dialog
                        setDialogOpen(false)

                        // Show success toast with action
                        toast.success('Quiz erstellt', {
                            action: {
                                label: 'Jetzt starten',
                                onClick: () => router.push(url)
                            }
                        })
                        return
                    } else if (event.type === 'error') {
                        throw new Error(event.message)
                    }
                }
            }
        } catch (error) {
            console.error('Quiz generation failed:', error)
            toast.error(error instanceof Error ? error.message : 'Fehler bei der Quiz-Erstellung')
        } finally {
            setGenerating(false)
        }
    }

    function handleDelete(quizId: string) {
        setDeleteTarget(quizId)
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        try {
            await deleteQuiz(deleteTarget)
            setQuizzes((prev) => prev.filter((q) => q.id !== deleteTarget))
            toast.success('Quiz gelöscht')
        } catch (error) {
            console.error('Quiz delete failed:', error)
            toast.error('Quiz konnte nicht gelöscht werden.')
        } finally {
            setDeleteTarget(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Build docId → subject map for filtering
    const docSubjectMap = new Map(documents.map((d) => [d.id, d.subject ?? null]))

    // Filter quizzes, progress, and documents by active subject
    const filteredQuizzes = activeSubject
        ? quizzes.filter((q) => q.document && docSubjectMap.get(q.document.id) === activeSubject)
        : quizzes
    const filteredProgress = activeSubject
        ? progress.filter((p) => docSubjectMap.get(p.documentId) === activeSubject)
        : progress
    const filteredDocuments = activeSubject
        ? documents.filter((d) => d.subject === activeSubject)
        : documents

    const hasDocuments = documents.length > 0
    const hasQuizzes = filteredQuizzes.length > 0
    const isEmpty = !hasQuizzes && filteredProgress.length === 0

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <HelpCircle className="h-6 w-6" />
                        Quiz
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {hasQuizzes
                            ? `${filteredQuizzes.length} Quiz${filteredQuizzes.length !== 1 ? 'ze' : ''} vorhanden`
                            : 'Erstelle Quizze aus deinem Lernmaterial und teste dein Wissen.'}
                    </p>
                </div>
                {hasDocuments && (
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Erstellen
                    </Button>
                )}
            </div>

            {/* Subject filter */}
            {subjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveSubject(null)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            !activeSubject ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                    >
                        Alle
                    </button>
                    {subjects.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setActiveSubject(activeSubject === s ? null : s)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                activeSubject === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {isEmpty && (
                hasDocuments ? (
                    <div className="text-center py-16 space-y-4">
                        <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground/50" />
                        <div>
                            <p className="text-lg font-medium">Noch keine Quizze</p>
                            <p className="text-muted-foreground mt-1">
                                Erstelle dein erstes Quiz, um dein Wissen zu testen.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16 space-y-4">
                        <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
                        <div>
                            <p className="text-lg font-medium">Kein Lernmaterial vorhanden</p>
                            <p className="text-muted-foreground mt-1">
                                <Link href="/learn/documents" className="text-primary underline underline-offset-4 hover:text-primary/80">
                                    Lade zuerst Lernmaterial hoch
                                </Link>
                                , um Quizze erstellen zu können.
                            </p>
                        </div>
                    </div>
                )
            )}

            {/* Knowledge progress per document */}
            {filteredProgress.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Wissensstand
                    </h2>
                    <div className="grid gap-3">
                        {filteredProgress.map((p) => (
                            <Card key={p.documentId}>
                                <CardContent className="flex items-center gap-4 py-4">
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium truncate">{p.documentTitle}</p>
                                            <span className="text-sm font-semibold tabular-nums shrink-0">
                                                {p.percentage} %
                                            </span>
                                        </div>
                                        <Progress value={p.percentage} />
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>
                                                {Math.round(p.correctScore)}/{p.answeredQuestions} Fragen richtig
                                            </span>
                                            {p.lastAttemptAt && (
                                                <span>· Zuletzt: {formatDate(p.lastAttemptAt)}</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Existing quizzes */}
            {hasQuizzes && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold">Vorhandene Quizze</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {filteredQuizzes.map((quiz) => {
                            const stats = getLastAttemptStats(quiz.questions)
                            return (
                                <QuizCard
                                    key={quiz.id}
                                    id={quiz.id}
                                    title={quiz.title}
                                    documentId={quiz.document?.id}
                                    documentTitle={quiz.document?.title}
                                    questionCount={quiz.questions.length}
                                    createdAt={String(quiz.createdAt)}
                                    lastAttemptAt={stats?.lastAttemptAt}
                                    lastAttemptPercent={stats?.percentage}
                                    onDelete={handleDelete}
                                />
                            )
                        })}
                    </div>
                </section>
            )}

            {/* Quiz creation dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Quiz erstellen</DialogTitle>
                        <DialogDescription>
                            Wähle eine Quelle und konfiguriere deine Quiz-Einstellungen.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        {/* Source toggle */}
                        <div className="flex rounded-md border overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setSourceMode('document')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                                    sourceMode === 'document'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground hover:bg-accent'
                                }`}
                            >
                                <FileText className="h-4 w-4" />
                                Dokument / Vokabelset
                            </button>
                            <button
                                type="button"
                                onClick={() => setSourceMode('scenario')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                                    sourceMode === 'scenario'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground hover:bg-accent'
                                }`}
                            >
                                <HelpCircle className="h-4 w-4" />
                                Konversationsübung
                            </button>
                        </div>

                        {/* Document source */}
                        {sourceMode === 'document' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Lernmaterial</label>
                                    <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
                                        {filteredDocuments.map((doc) => {
                                            const isChecked = selectedDocIds.includes(doc.id)
                                            return (
                                                <label key={doc.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer text-sm">
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={() => {
                                                            setSelectedDocIds(prev =>
                                                                isChecked ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                                                            )
                                                        }}
                                                    />
                                                    <span className="truncate">{doc.title}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                    {selectedDocIds.length > 0 && (
                                        <p className="text-xs text-muted-foreground">{selectedDocIds.length} ausgewählt</p>
                                    )}
                                </div>

                                {selectedDocIds.length > 0 && selectedDocIds.every(id => documents.find(d => d.id === id)?.fileType === 'language-set') && (
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-md">
                                        Vokabelquiz — Fragen werden sofort aus den Vokabeldaten generiert (kein LLM nötig).
                                    </p>
                                )}
                            </>
                        )}

                        {/* Scenario source */}
                        {sourceMode === 'scenario' && (
                            <div className="space-y-3">
                                {/* Language selector */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sprache</label>
                                    <div className="flex gap-2">
                                        {(Object.entries(LANGUAGE_LABELS) as [Language, { name: string; flag: string }][]).map(([lang, meta]) => (
                                            <button
                                                key={lang}
                                                type="button"
                                                onClick={() => setScenarioLanguage(lang)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                                                    scenarioLanguage === lang
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-transparent bg-muted text-muted-foreground hover:bg-accent'
                                                }`}
                                            >
                                                <span>{meta.flag}</span>
                                                <span>{meta.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Scenario list */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Szenario wählen</label>
                                    <div className="border rounded-md max-h-52 overflow-y-auto p-2 space-y-1">
                                        {(() => {
                                            const userLevel = learningGoals.find(g => g.language === scenarioLanguage)?.targetLevel ?? null
                                            return scenarioOptions.length === 0 ? (
                                                <p className="text-xs text-muted-foreground p-2">Keine Szenarien verfügbar.</p>
                                            ) : scenarioOptions.map((s) => {
                                                const isRecommended = userLevel !== null && s.difficulty.includes(userLevel)
                                                return (
                                                    <label
                                                        key={s.key}
                                                        className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                                                            selectedScenario?.key === s.key
                                                                ? 'bg-primary/10 border border-primary/30'
                                                                : 'hover:bg-accent border border-transparent'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="scenario"
                                                            value={s.key}
                                                            checked={selectedScenario?.key === s.key}
                                                            onChange={() => setSelectedScenario(s)}
                                                            className="sr-only"
                                                        />
                                                        <span className="text-xl leading-none mt-0.5">{s.icon}</span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm font-medium">{s.title}</span>
                                                                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s.difficulty}</span>
                                                                {isRecommended && (
                                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">Empfohlen</span>
                                                                )}
                                                                {s.isGenerated && (
                                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Eigenes</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                                                        </div>
                                                    </label>
                                                )
                                            })
                                        })()}
                                    </div>
                                </div>

                                {/* Read-only difficulty badge */}
                                {selectedScenario && (
                                    <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-md">
                                        Schwierigkeit wird automatisch aus dem CEFR-Niveau abgeleitet:{' '}
                                        <strong>{selectedScenario.difficulty}</strong>{' '}
                                        → Stufe {cefrToDifficulty(selectedScenario.difficulty)}{' '}
                                        ({DIFFICULTY_LEVELS.find(l => l.value === cefrToDifficulty(selectedScenario.difficulty))?.label})
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Anzahl Fragen</label>
                            <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[3, 5, 10, 15, 20].map((n) => (
                                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Fragetypen ({questionTypes.length})
                            </label>
                            <div className="space-y-2">
                                {QUESTION_TYPES.map((type) => (
                                    <label
                                        key={type.value}
                                        className="flex items-center gap-2.5 text-sm cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={questionTypes.includes(type.value)}
                                            onCheckedChange={() => toggleQuestionType(type.value)}
                                        />
                                        <span>{type.label}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Pro ausgewähltem Fragetyp wird mindestens eine Frage erstellt. Die Fragen werden möglichst gleichmäßig auf alle Fragetypen verteilt.
                            </p>
                        </div>

                        {/* Difficulty — only shown in document mode */}
                        {sourceMode === 'document' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Schwierigkeitsstufe</label>
                                <div className="space-y-1.5">
                                    {DIFFICULTY_LEVELS.map((level) => (
                                        <label
                                            key={level.value}
                                            className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                                                difficulty === level.value
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-transparent hover:bg-accent'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="difficulty"
                                                value={level.value}
                                                checked={difficulty === level.value}
                                                onChange={() => setDifficulty(level.value)}
                                                className="sr-only"
                                            />
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                    difficulty === level.value
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    {level.value}
                                                </span>
                                                <div>
                                                    <span className="text-sm font-medium">
                                                        {level.label}
                                                        {recommendedDifficulty === level.value && (
                                                            <span className="ml-1.5 text-xs text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                                                                Empfohlen
                                                                <TooltipProvider delayDuration={200}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <HelpCircle className="h-3 w-3 cursor-help" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="max-w-xs">
                                                                            <p className="text-xs">
                                                                                Basierend auf deiner bisherigen Leistung: Die höchste Stufe mit ≥80% Erfolgsrate.
                                                                            </p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </span>
                                                        )}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground">{level.description}</p>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Exam mode */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Prüfungsmodus</label>
                                <Switch checked={examMode} onCheckedChange={setExamMode} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Alle Fragen auf einer Seite mit Countdown-Timer. Antworten werden erst nach Abgabe ausgewertet.
                            </p>
                            {examMode && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Zeitlimit</label>
                                    <Select value={String(examTimeLimit)} onValueChange={(v) => setExamTimeLimit(Number(v))}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[10, 15, 20, 30, 45, 60].map((n) => (
                                                <SelectItem key={n} value={String(n)}>{n} Minuten</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleGenerate}
                            disabled={
                                generating ||
                                questionTypes.length === 0 ||
                                (sourceMode === 'document' && selectedDocIds.length === 0) ||
                                (sourceMode === 'scenario' && !selectedScenario)
                            }
                            className="w-full"
                        >
                            {generating
                                ? <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {generatedCount > 0
                                        ? `${generatedCount} von ${questionCount} Fragen generiert…`
                                        : 'Fragen werden generiert…'}
                                </>
                                : 'Quiz generieren'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Quiz löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Das Quiz und alle Ergebnisse werden unwiderruflich gelöscht.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
