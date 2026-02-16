'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
    Layers,
    Plus,
    Sparkles,
    Loader2,
    Trash2,
    GraduationCap,
    FileText,
    CheckCircle2,
    Clock,
    Info,
    X,
} from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/ui/select'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/src/components/ui/tooltip'
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
    getFlashcards,
    getDueFlashcardCount,
    createFlashcard,
    deleteFlashcard,
    deleteFlashcardsByDocument,
} from '@/src/actions/flashcards'
import { getDocuments } from '@/src/actions/documents'

interface Document {
    id: string
    title: string
    fileType: string
}

interface FlashcardItem {
    id: string
    front: string
    back: string
    context: string | null
    createdAt: string | Date
    document: { id: string; title: string }
    progress: {
        nextReviewAt: string | Date
        lastReviewedAt: string | Date | null
        easeFactor: number
        repetitions: number
    } | null
}

function formatDaysUntil(date: string | Date): string {
    const now = new Date()
    const target = new Date(date)
    const days = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    if (days === 0) return 'heute'
    if (days === 1) return 'morgen'
    return `in ${days} Tagen`
}

export default function FlashcardsPage() {
    const [flashcards, setFlashcards] = useState<FlashcardItem[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [dueCount, setDueCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [infoVisible, setInfoVisible] = useState(() => {
        if (typeof window === 'undefined') return true
        return localStorage.getItem('lai-flashcard-info-dismissed') !== 'true'
    })

    // Generate dialog
    const [genOpen, setGenOpen] = useState(false)
    const [genDocId, setGenDocId] = useState('')
    const [genCount, setGenCount] = useState(10)
    const [generating, setGenerating] = useState(false)
    const [genProgress, setGenProgress] = useState<{ generated: number; total: number } | null>(null)

    // Manual create dialog
    const [createOpen, setCreateOpen] = useState(false)
    const [createDocId, setCreateDocId] = useState('')
    const [createFront, setCreateFront] = useState('')
    const [createBack, setCreateBack] = useState('')
    const [createContext, setCreateContext] = useState('')
    const [creating, setCreating] = useState(false)

    // Delete confirmation (single card)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    // Delete confirmation (all cards for a document)
    const [deleteDocTarget, setDeleteDocTarget] = useState<{ id: string; title: string; count: number } | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            const [cards, docs, due] = await Promise.all([
                getFlashcards(),
                getDocuments(),
                getDueFlashcardCount(),
            ])
            setFlashcards(cards as unknown as FlashcardItem[])
            setDocuments(docs as unknown as Document[])
            setDueCount(due)
        } catch (err) {
            console.error('Failed to load flashcards:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleGenerate() {
        if (!genDocId) return
        setGenerating(true)
        setGenProgress({ generated: 0, total: genCount })

        try {
            const res = await fetch('/api/flashcards/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: genDocId, count: genCount }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Fehler beim Generieren')
            }

            const reader = res.body!.getReader()
            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const data = JSON.parse(line.slice(6))

                    if (data.type === 'progress') {
                        setGenProgress({ generated: data.generated, total: data.total })
                    } else if (data.type === 'complete') {
                        toast.success(`${data.generated} Karteikarten generiert`)
                        setGenOpen(false)
                        await loadData()
                    } else if (data.type === 'error') {
                        throw new Error(data.message)
                    }
                }
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Fehler beim Generieren')
        } finally {
            setGenerating(false)
            setGenProgress(null)
        }
    }

    async function handleCreate() {
        if (!createDocId || !createFront.trim() || !createBack.trim()) return
        setCreating(true)
        try {
            await createFlashcard(createDocId, createFront, createBack, createContext || undefined)
            toast.success('Karteikarte erstellt')
            setCreateOpen(false)
            setCreateFront('')
            setCreateBack('')
            setCreateContext('')
            await loadData()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Fehler beim Erstellen')
        } finally {
            setCreating(false)
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        try {
            await deleteFlashcard(deleteTarget)
            setFlashcards((prev) => prev.filter((c) => c.id !== deleteTarget))
            setDueCount((prev) => Math.max(0, prev - 1))
        } catch {
            toast.error('Karteikarte konnte nicht gelöscht werden.')
        } finally {
            setDeleteTarget(null)
        }
    }

    async function confirmDeleteByDocument() {
        if (!deleteDocTarget) return
        try {
            const deleted = await deleteFlashcardsByDocument(deleteDocTarget.id)
            setFlashcards((prev) => prev.filter((c) => c.document.id !== deleteDocTarget.id))
            setDueCount((prev) => Math.max(0, prev - deleted))
            toast.success(`${deleted} Karteikarte${deleted !== 1 ? 'n' : ''} gelöscht`)
        } catch {
            toast.error('Karteikarten konnten nicht gelöscht werden.')
        } finally {
            setDeleteDocTarget(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Group flashcards by document
    const grouped = new Map<string, { title: string; cards: FlashcardItem[] }>()
    for (const card of flashcards) {
        const key = card.document.id
        if (!grouped.has(key)) {
            grouped.set(key, { title: card.document.title, cards: [] })
        }
        grouped.get(key)!.cards.push(card)
    }

    const hasDocuments = documents.length > 0
    const hasCards = flashcards.length > 0

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Layers className="h-6 w-6" />
                        Karteikarten
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {hasCards
                            ? `${flashcards.length} Karteikarte${flashcards.length !== 1 ? 'n' : ''} vorhanden`
                            : 'Erstelle Karteikarten aus deinem Lernmaterial oder manuell.'}
                    </p>
                </div>
                {hasDocuments && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Manuell erstellen
                        </Button>
                        <Button onClick={() => setGenOpen(true)}>
                            <Sparkles className="h-4 w-4" />
                            Generieren
                        </Button>
                    </div>
                )}
            </div>

            {/* Info box — explains spaced repetition and badges */}
            {infoVisible && hasCards && (
                <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                    <CardContent className="p-4 relative">
                        <button
                            type="button"
                            onClick={() => {
                                setInfoVisible(false)
                                localStorage.setItem('lai-flashcard-info-dismissed', 'true')
                            }}
                            className="absolute top-3 right-3 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                        >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <div className="flex gap-3">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-2 pr-6">
                                <p className="font-medium text-sm">So funktioniert smartes Lernen</p>
                                <p className="text-sm text-muted-foreground">
                                    Karteikarten nutzen <span className="font-medium text-foreground">Spaced Repetition</span> — eine wissenschaftlich
                                    bewährte Lernmethode. Karten, die du gut kennst, erscheinen in immer größeren Abständen.
                                    Karten, die du nicht kennst, kommen häufiger dran. So verankerst du Wissen langfristig.
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    <span><Badge variant="secondary" className="text-xs mr-1">Neu</Badge> Noch nie gelernt</span>
                                    <span><Badge variant="outline" className="text-xs border-orange-300 text-orange-600 mr-1"><Clock className="h-2.5 w-2.5 mr-0.5" />Fällig</Badge> Bereit zur Wiederholung</span>
                                    <span><Badge variant="outline" className="text-xs border-green-300 text-green-600 mr-1"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Gelernt</Badge> Gut verankert</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Study banner */}
            {hasCards && (
                <Card className={`border-primary/30 ${dueCount > 0 ? 'bg-primary/5' : 'bg-muted/30'}`}>
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            <div>
                                {dueCount > 0 ? (
                                    <>
                                        <p className="font-medium">
                                            {dueCount} Karteikarte{dueCount !== 1 ? 'n' : ''} fällig
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Wiederhole jetzt deine fälligen Karten
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium">Keine Karten fällig</p>
                                        <p className="text-sm text-muted-foreground">
                                            Du kannst trotzdem alle Karten üben
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {dueCount > 0 && (
                                <Button asChild>
                                    <Link href="/learn/flashcards/study">Fällige lernen</Link>
                                </Button>
                            )}
                            <Button variant={dueCount > 0 ? 'outline' : 'default'} asChild>
                                <Link href="/learn/flashcards/study?all=true">Alle üben</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {!hasCards && (
                hasDocuments ? (
                    <div className="text-center py-16 space-y-4">
                        <Layers className="h-16 w-16 mx-auto text-muted-foreground/50" />
                        <div>
                            <p className="text-lg font-medium">Noch keine Karteikarten</p>
                            <p className="text-muted-foreground mt-1">
                                Generiere Karteikarten aus deinem Lernmaterial oder erstelle sie manuell.
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
                                , um Karteikarten erstellen zu koennen.
                            </p>
                        </div>
                    </div>
                )
            )}

            {/* Flashcards grouped by document */}
            <TooltipProvider>
            {[...grouped.entries()].map(([docId, group]) => (
                <section key={docId} className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {group.title}
                            <Badge variant="secondary">{group.cards.length}</Badge>
                        </h2>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setDeleteDocTarget({ id: docId, title: group.title, count: group.cards.length })}
                                    className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Alle Karten zu diesem Thema löschen</TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {group.cards.map((card) => {
                            const isDue = card.progress && new Date(card.progress.nextReviewAt) <= new Date()
                            const isNew = !card.progress
                            const isMastered = card.progress && card.progress.repetitions >= 3

                            return (
                            <Card key={card.id} className="group relative">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-medium text-sm">{card.front}</p>
                                        {isNew && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge variant="secondary" className="shrink-0 text-xs cursor-help">Neu</Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>Diese Karte wurde noch nie gelernt</TooltipContent>
                                            </Tooltip>
                                        )}
                                        {isDue && !isNew && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge variant="outline" className="shrink-0 text-xs border-orange-300 text-orange-600 cursor-help">
                                                        <Clock className="h-3 w-3 mr-0.5" />
                                                        Fällig
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>Der optimale Zeitpunkt zur Wiederholung ist erreicht</TooltipContent>
                                            </Tooltip>
                                        )}
                                        {!isDue && !isNew && isMastered && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge variant="outline" className="shrink-0 text-xs border-green-300 text-green-600 cursor-help">
                                                        <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                                        Gelernt
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Gut verankert — nächste Wiederholung {formatDaysUntil(card.progress!.nextReviewAt)}
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                        {!isDue && !isNew && !isMastered && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge variant="outline" className="shrink-0 text-xs cursor-help">
                                                        <Clock className="h-3 w-3 mr-0.5" />
                                                        Wdh. {formatDaysUntil(card.progress!.nextReviewAt)}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Diese Karte wird {formatDaysUntil(card.progress!.nextReviewAt)} automatisch wieder fällig
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{card.back}</p>
                                    {card.context && (
                                        <p className="text-xs text-muted-foreground italic">{card.context}</p>
                                    )}
                                </CardContent>
                                <button
                                    type="button"
                                    onClick={() => setDeleteTarget(card.id)}
                                    className="absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </button>
                            </Card>
                            )
                        })}
                    </div>
                </section>
            ))}
            </TooltipProvider>

            {/* Generate dialog */}
            <Dialog open={genOpen} onOpenChange={setGenOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Karteikarten generieren</DialogTitle>
                        <DialogDescription>
                            KI erstellt Karteikarten aus dem gewählten Lernmaterial.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lernmaterial</label>
                            <Select value={genDocId} onValueChange={setGenDocId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Bitte wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {documents.map((doc) => (
                                        <SelectItem key={doc.id} value={doc.id}>{doc.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Anzahl Karten</label>
                            <Select value={String(genCount)} onValueChange={(v) => setGenCount(Number(v))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 15, 20].map((n) => (
                                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {generating && genProgress ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generiere Karteikarten…
                                </span>
                                <span className="text-muted-foreground tabular-nums">
                                    {genProgress.generated} / {genProgress.total}
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-300"
                                    style={{ width: `${Math.max(2, (genProgress.generated / genProgress.total) * 100)}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={!genDocId}
                            className="w-full"
                        >
                            Generieren
                        </Button>
                    )}
                </DialogContent>
            </Dialog>

            {/* Manual create dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Karteikarte erstellen</DialogTitle>
                        <DialogDescription>
                            Erstelle eine neue Karteikarte manuell.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lernmaterial</label>
                            <Select value={createDocId} onValueChange={setCreateDocId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Bitte wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {documents.map((doc) => (
                                        <SelectItem key={doc.id} value={doc.id}>{doc.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Vorderseite (Frage/Begriff)</label>
                            <Input
                                value={createFront}
                                onChange={(e) => setCreateFront(e.target.value)}
                                placeholder="z.B. Was ist Photosynthese?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rückseite (Antwort/Definition)</label>
                            <Textarea
                                value={createBack}
                                onChange={(e) => setCreateBack(e.target.value)}
                                className="min-h-20 resize-y"
                                placeholder="z.B. Der Prozess, bei dem Pflanzen Lichtenergie in chemische Energie umwandeln."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Kontext (optional)</label>
                            <Input
                                value={createContext}
                                onChange={(e) => setCreateContext(e.target.value)}
                                placeholder="z.B. Kapitel 3: Biologie der Pflanzen"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleCreate}
                        disabled={!createDocId || !createFront.trim() || !createBack.trim() || creating}
                        className="w-full"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Erstelle...
                            </>
                        ) : (
                            'Erstellen'
                        )}
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation (single card) */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Karteikarte löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Die Karteikarte und ihr Lernfortschritt werden unwiderruflich gelöscht.
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

            {/* Delete confirmation (all cards for a document) */}
            <AlertDialog open={!!deleteDocTarget} onOpenChange={(open) => { if (!open) setDeleteDocTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Alle Karteikarten löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteDocTarget && (
                                <>
                                    Alle {deleteDocTarget.count} Karteikarte{deleteDocTarget.count !== 1 ? 'n' : ''} zu
                                    {' '}<span className="font-medium">{deleteDocTarget.title}</span> und
                                    deren Lernfortschritt werden unwiderruflich gelöscht.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteByDocument} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Alle löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
