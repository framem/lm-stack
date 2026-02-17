'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    CalendarDays,
    Plus,
    Loader2,
    BookOpen,
    HelpCircle,
    Layers,
    RotateCcw,
    Check,
    SkipForward,
    Trash2,
    ChevronDown,
    ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Input } from '@/src/components/ui/input'
import { Checkbox } from '@/src/components/ui/checkbox'
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
    getStudyPlans,
    generateStudyPlan,
    completeTask,
    skipTask,
    deleteStudyPlan,
} from '@/src/actions/study-plan'
import { getDocuments } from '@/src/actions/documents'

interface Document {
    id: string
    title: string
    fileType: string
    subject?: string | null
}

interface StudyTask {
    id: string
    date: string | Date
    topic: string
    description: string | null
    taskType: string
    documentId: string | null
    status: string
    completedAt: string | Date | null
}

interface StudyPlan {
    id: string
    title: string
    examDate: string | Date
    documentIds: string[]
    status: string
    tasks: StudyTask[]
}

const TASK_TYPE_ICONS: Record<string, typeof BookOpen> = {
    read: BookOpen,
    flashcards: Layers,
    quiz: HelpCircle,
    review: RotateCcw,
}

const TASK_TYPE_LABELS: Record<string, string> = {
    read: 'Lesen',
    flashcards: 'Karteikarten',
    quiz: 'Quiz',
    review: 'Wiederholung',
}

function formatDate(d: string | Date) {
    return new Date(d).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

function isToday(d: string | Date) {
    const date = new Date(d)
    const today = new Date()
    return date.toDateString() === today.toDateString()
}

function isPast(d: string | Date) {
    const date = new Date(d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
}

// Group tasks by date
function groupByDate(tasks: StudyTask[]) {
    const groups = new Map<string, StudyTask[]>()
    for (const t of tasks) {
        const key = new Date(t.date).toISOString().split('T')[0]
        const group = groups.get(key) ?? []
        group.push(t)
        groups.set(key, group)
    }
    return groups
}

export function PlanContent() {
    const router = useRouter()
    const [plans, setPlans] = useState<StudyPlan[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

    // Form state
    const [planTitle, setPlanTitle] = useState('')
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
    const [examDate, setExamDate] = useState('')

    useEffect(() => {
        async function load() {
            try {
                const [planList, docList] = await Promise.all([
                    getStudyPlans(),
                    getDocuments(),
                ])
                setPlans(planList as StudyPlan[])
                setDocuments(docList as unknown as Document[])

                // Auto-expand today
                const todayKey = new Date().toISOString().split('T')[0]
                setExpandedDays(new Set([todayKey]))
            } catch (error) {
                console.error('Failed to load plans:', error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    async function handleGenerate() {
        if (!planTitle.trim() || selectedDocIds.length === 0 || !examDate) return
        setGenerating(true)
        try {
            await generateStudyPlan({
                title: planTitle.trim(),
                documentIds: selectedDocIds,
                examDate,
            })
            // Reload
            const updated = await getStudyPlans()
            setPlans(updated as StudyPlan[])
            setDialogOpen(false)
            setPlanTitle('')
            setSelectedDocIds([])
            setExamDate('')
            toast.success('Lernplan erstellt!')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Lernplan konnte nicht erstellt werden.')
        } finally {
            setGenerating(false)
        }
    }

    async function handleComplete(taskId: string) {
        try {
            await completeTask(taskId)
            setPlans((prev) =>
                prev.map((p) => ({
                    ...p,
                    tasks: p.tasks.map((t) =>
                        t.id === taskId ? { ...t, status: 'done', completedAt: new Date().toISOString() } : t
                    ),
                }))
            )
        } catch {
            toast.error('Aufgabe konnte nicht abgeschlossen werden.')
        }
    }

    async function handleSkip(taskId: string) {
        try {
            await skipTask(taskId)
            setPlans((prev) =>
                prev.map((p) => ({
                    ...p,
                    tasks: p.tasks.map((t) =>
                        t.id === taskId ? { ...t, status: 'skipped' } : t
                    ),
                }))
            )
        } catch {
            toast.error('Aufgabe konnte nicht übersprungen werden.')
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        try {
            await deleteStudyPlan(deleteTarget)
            setPlans((prev) => prev.filter((p) => p.id !== deleteTarget))
            toast.success('Lernplan gelöscht')
        } catch {
            toast.error('Lernplan konnte nicht gelöscht werden.')
        } finally {
            setDeleteTarget(null)
        }
    }

    function toggleDay(key: string) {
        setExpandedDays((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const activePlans = plans.filter((p) => p.status === 'active')

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarDays className="h-6 w-6" />
                        Lernplan
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Plane dein Lernen bis zur Prüfung — Tag für Tag.
                    </p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Neuer Plan
                </Button>
            </div>

            {/* Active plans */}
            {activePlans.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <div>
                        <p className="text-lg font-medium">Kein Lernplan aktiv</p>
                        <p className="text-muted-foreground mt-1">
                            Erstelle einen Lernplan mit Prüfungstermin, um strukturiert zu lernen.
                        </p>
                    </div>
                </div>
            ) : (
                activePlans.map((plan) => {
                    const totalTasks = plan.tasks.length
                    const doneTasks = plan.tasks.filter((t) => t.status === 'done').length
                    const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
                    const daysLeft = Math.max(0, Math.ceil(
                        (new Date(plan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    ))
                    const grouped = groupByDate(plan.tasks)

                    return (
                        <Card key={plan.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Prüfung: {formatDate(plan.examDate)} · {daysLeft} Tage übrig
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setDeleteTarget(plan.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <Progress value={progressPct} className="flex-1" />
                                    <span className="text-sm font-medium tabular-nums shrink-0">
                                        {doneTasks}/{totalTasks}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {Array.from(grouped.entries()).map(([dateKey, tasks]) => {
                                    const dayIsToday = isToday(dateKey + 'T12:00:00')
                                    const dayIsPast = isPast(dateKey + 'T12:00:00')
                                    const allDone = tasks.every((t) => t.status !== 'pending')
                                    const expanded = expandedDays.has(dateKey)

                                    return (
                                        <div key={dateKey} className={`rounded-lg border ${dayIsToday ? 'border-primary/40 bg-primary/5' : ''}`}>
                                            <button
                                                type="button"
                                                onClick={() => toggleDay(dateKey)}
                                                className="flex items-center gap-2 w-full p-3 text-left hover:bg-accent/50 rounded-lg transition-colors"
                                            >
                                                {expanded ? (
                                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                )}
                                                <span className={`text-sm font-medium ${dayIsToday ? 'text-primary' : ''}`}>
                                                    {dayIsToday ? 'Heute' : formatDate(dateKey + 'T12:00:00')}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {tasks.filter((t) => t.status === 'done').length}/{tasks.length} erledigt
                                                </span>
                                                {allDone && <Check className="h-3.5 w-3.5 text-emerald-500 ml-auto" />}
                                                {dayIsPast && !allDone && (
                                                    <Badge variant="outline" className="text-xs ml-auto text-amber-600 border-amber-300">
                                                        Ausstehend
                                                    </Badge>
                                                )}
                                            </button>
                                            {expanded && (
                                                <div className="px-3 pb-3 space-y-1.5">
                                                    {tasks.map((task) => {
                                                        const Icon = TASK_TYPE_ICONS[task.taskType] ?? BookOpen
                                                        const isDone = task.status === 'done'
                                                        const isSkipped = task.status === 'skipped'

                                                        return (
                                                            <div
                                                                key={task.id}
                                                                className={`flex items-center gap-3 p-2.5 rounded-md ${
                                                                    isDone ? 'opacity-50' : isSkipped ? 'opacity-30' : 'bg-background'
                                                                }`}
                                                            >
                                                                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className={`text-sm ${isDone ? 'line-through' : ''}`}>
                                                                        {task.description ?? task.topic}
                                                                    </p>
                                                                    <Badge variant="outline" className="text-[10px] mt-0.5">
                                                                        {TASK_TYPE_LABELS[task.taskType] ?? task.taskType}
                                                                    </Badge>
                                                                </div>
                                                                {!isDone && !isSkipped && (
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7"
                                                                            onClick={() => handleComplete(task.id)}
                                                                            title="Erledigt"
                                                                        >
                                                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7"
                                                                            onClick={() => handleSkip(task.id)}
                                                                            title="Überspringen"
                                                                        >
                                                                            <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                                {isDone && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    )
                })
            )}

            {/* Create plan dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Lernplan erstellen</DialogTitle>
                        <DialogDescription>
                            Wähle Lernmaterialien und dein Prüfungsdatum. Der Plan verteilt die Themen automatisch.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Titel</label>
                            <Input
                                placeholder="z.B. Datenbanken Klausur"
                                value={planTitle}
                                onChange={(e) => setPlanTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Prüfungsdatum</label>
                            <Input
                                type="date"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lernmaterial</label>
                            <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-1">
                                {documents.map((doc) => {
                                    const isChecked = selectedDocIds.includes(doc.id)
                                    return (
                                        <label key={doc.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer text-sm">
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={() => {
                                                    setSelectedDocIds((prev) =>
                                                        isChecked ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]
                                                    )
                                                }}
                                            />
                                            <span className="truncate">{doc.title}</span>
                                        </label>
                                    )
                                })}
                                {documents.length === 0 && (
                                    <p className="text-sm text-muted-foreground p-2">Kein Lernmaterial vorhanden.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleGenerate}
                            disabled={!planTitle.trim() || selectedDocIds.length === 0 || !examDate || generating}
                            className="w-full"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Plan wird erstellt…
                                </>
                            ) : (
                                'Lernplan generieren'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Lernplan löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Der Lernplan und alle Aufgaben werden unwiderruflich gelöscht.
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
