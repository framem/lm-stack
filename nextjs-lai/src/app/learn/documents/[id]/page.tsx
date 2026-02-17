'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, Trash2, Pencil, ArrowLeft, Check, X, Loader2, ChevronDown, ChevronRight, List, MessageSquare, Brain, CreditCard, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardContent } from '@/src/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/tabs'
import { ChunkViewer, type ChunkViewerHandle } from '@/src/components/ChunkViewer'
import { ChatInterface } from '@/src/components/ChatInterface'
import { DocumentQuizzesTab } from '@/src/components/DocumentQuizzesTab'
import { DocumentFlashcardsTab } from '@/src/components/DocumentFlashcardsTab'
import { TableOfContents } from '@/src/components/TableOfContents'
import { Skeleton } from '@/src/components/ui/skeleton'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/src/components/ui/collapsible'
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
import { getDocument, deleteDocument, renameDocument, hasChunksWithoutEmbeddings } from '@/src/actions/documents'
import { formatDate } from '@/src/lib/utils'

interface TocSection {
    title: string
    level: number
    startChunkIndex: number
}

interface DocumentDetail {
    id: string
    title: string
    fileName: string | null
    fileType: string
    fileSize: number | null
    content: string
    summary: string | null
    tableOfContents: TocSection[] | null
    createdAt: string
    chunks: {
        id: string
        content: string
        chunkIndex: number
        pageNumber: number | null
        tokenCount: number | null
    }[]
}

export default function DocumentDetailPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const [document, setDocument] = useState<DocumentDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [editing, setEditing] = useState(false)
    const [editTitle, setEditTitle] = useState('')
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [summaryText, setSummaryText] = useState('')
    const [generatingSummary, setGeneratingSummary] = useState(false)
    const [tocSections, setTocSections] = useState<TocSection[]>([])
    const [generatingToc, setGeneratingToc] = useState(false)
    const [tocOpen, setTocOpen] = useState(true)
    const [extractingTopics, setExtractingTopics] = useState(false)
    const [activeTab, setActiveTab] = useState('content')
    const chunkViewerRef = useRef<ChunkViewerHandle>(null)
    const [hasEmbeddingIssues, setHasEmbeddingIssues] = useState(false)
    const [regeneratingEmbeddings, setRegeneratingEmbeddings] = useState(false)

    const fetchDocument = useCallback(async () => {
        try {
            const data = await getDocument(params.id)
            setDocument(data as unknown as DocumentDetail)
            if ((data as unknown as DocumentDetail)?.summary) {
                setSummaryText((data as unknown as DocumentDetail).summary!)
            }
            const toc = (data as unknown as DocumentDetail)?.tableOfContents
            if (toc && Array.isArray(toc) && toc.length > 0) {
                setTocSections(toc)
            }

            // Check if document has chunks without embeddings
            const needsEmbeddings = await hasChunksWithoutEmbeddings(params.id)
            setHasEmbeddingIssues(needsEmbeddings)
        } catch {
            setError('Lernmaterial nicht gefunden.')
        } finally {
            setLoading(false)
        }
    }, [params.id])

    useEffect(() => {
        fetchDocument()
    }, [fetchDocument])

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteDocument(params.id)
            router.push('/learn/documents')
        } catch {
            toast.error('Löschen fehlgeschlagen.')
            setDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    async function handleRename() {
        const trimmed = editTitle.trim()
        if (!trimmed || !document || trimmed === document.title) {
            setEditing(false)
            return
        }
        try {
            await renameDocument(params.id, trimmed)
            setDocument((prev) => prev ? { ...prev, title: trimmed } : prev)
            setEditing(false)
        } catch {
            toast.error('Umbenennen fehlgeschlagen.')
        }
    }

    async function handleGenerateSummary() {
        setGeneratingSummary(true)
        setSummaryText('')
        try {
            const res = await fetch(`/api/documents/${params.id}/summary`, { method: 'POST' })
            if (!res.ok) throw new Error('Fehler')
            const data = await res.json()
            if (data.summary) {
                setSummaryText(data.summary)
            } else {
                throw new Error('Keine Zusammenfassung erhalten')
            }
        } catch {
            toast.error('Zusammenfassung konnte nicht erstellt werden.')
        } finally {
            setGeneratingSummary(false)
        }
    }

    async function handleGenerateToc() {
        setGeneratingToc(true)
        setTocSections([])
        try {
            const res = await fetch(`/api/documents/${params.id}/toc`, { method: 'POST' })
            if (!res.ok) throw new Error('Fehler')
            const data = await res.json()
            if (data.tableOfContents) {
                setTocSections(data.tableOfContents)
            } else {
                throw new Error('Kein Inhaltsverzeichnis')
            }
        } catch {
            toast.error('Inhaltsverzeichnis konnte nicht erstellt werden.')
        } finally {
            setGeneratingToc(false)
        }
    }

    async function handleExtractTopics() {
        setExtractingTopics(true)
        try {
            const res = await fetch(`/api/documents/${params.id}/topics`, { method: 'POST' })
            if (!res.ok) throw new Error('Fehler')
            const data = await res.json()
            toast.success(`${data.topics?.length ?? 0} Themen extrahiert.`)
        } catch {
            toast.error('Themenextraktion fehlgeschlagen.')
        } finally {
            setExtractingTopics(false)
        }
    }

    async function handleRegenerateEmbeddings() {
        setRegeneratingEmbeddings(true)
        try {
            const res = await fetch(`/api/documents/${params.id}/regenerate-embeddings`, { method: 'POST' })
            if (!res.ok) throw new Error('Fehler')

            const reader = res.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                throw new Error('Stream nicht verfügbar')
            }

            let regeneratedCount = 0

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'))

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.replace(/^data:\s*/, ''))

                        if (data.type === 'complete') {
                            regeneratedCount = data.regeneratedCount ?? 0
                            if (regeneratedCount > 0) {
                                setHasEmbeddingIssues(false)
                                toast.success(data.message || 'Embeddings erfolgreich regeneriert.')
                            } else {
                                toast.info(data.message || 'Alle Abschnitte haben bereits Embeddings.')
                            }
                        } else if (data.type === 'error') {
                            toast.error(data.error || 'Regenerierung fehlgeschlagen.')
                        }
                    } catch {
                        // Ignore parse errors for partial chunks
                    }
                }
            }
        } catch {
            toast.error('Embedding-Regenerierung fehlgeschlagen.')
        } finally {
            setRegeneratingEmbeddings(false)
        }
    }

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        )
    }

    if (error || !document) {
        return (
            <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
                <p className="text-destructive">{error || 'Lernmaterial nicht gefunden.'}</p>
                <Button variant="outline" onClick={() => router.push('/learn/documents')}>
                    <ArrowLeft className="h-4 w-4" />
                    Zurück
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-2"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Zurück
                    </Button>
                    {editing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename()
                                    if (e.key === 'Escape') setEditing(false)
                                }}
                                autoFocus
                                className="text-xl font-bold h-10"
                            />
                            <Button variant="ghost" size="icon-xs" onClick={handleRename}>
                                <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon-xs" onClick={() => setEditing(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <h1 className="text-2xl font-bold flex items-center gap-2 max-w-full min-w-0">
                            <FileText className="h-6 w-6 shrink-0" />
                            <span className="truncate" title={document.title}>{document.title}</span>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => { setEditTitle(document.title); setEditing(true) }}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </h1>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        {document.fileName && (
                            <Badge variant="outline" className="max-w-xs truncate" title={document.fileName}>{document.fileName}</Badge>
                        )}
                        <Badge variant="secondary">{document.chunks.length} Abschnitte</Badge>
                        <span className="text-sm text-muted-foreground">
                            {formatDate(document.createdAt)}
                        </span>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleting}
                >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? 'Wird gelöscht...' : 'Löschen'}
                </Button>
            </div>

            {/* "Jetzt lernen" Action Block */}
            <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-background border-primary/20">
                <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Jetzt lernen
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Quiz Button */}
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-auto flex flex-col items-center gap-3 p-6 hover:bg-primary/10 hover:border-primary transition-all"
                            onClick={() => setActiveTab('quizzes')}
                        >
                            <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                                <Brain className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-base mb-1">Quiz starten</div>
                                <div className="text-xs text-muted-foreground">Wissen überprüfen</div>
                            </div>
                        </Button>

                        {/* Flashcards Button */}
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-auto flex flex-col items-center gap-3 p-6 hover:bg-primary/10 hover:border-primary transition-all"
                            onClick={() => setActiveTab('flashcards')}
                        >
                            <div className="p-3 rounded-full bg-purple-500/10 text-purple-500">
                                <CreditCard className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-base mb-1">Karteikarten üben</div>
                                <div className="text-xs text-muted-foreground">Mit Spaced Repetition</div>
                            </div>
                        </Button>

                        {/* Chat Button */}
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-auto flex flex-col items-center gap-3 p-6 hover:bg-primary/10 hover:border-primary transition-all"
                            onClick={() => setActiveTab('chat')}
                        >
                            <div className="p-3 rounded-full bg-green-500/10 text-green-500">
                                <MessageSquare className="h-8 w-8" />
                            </div>
                            <div className="text-center">
                                <div className="font-semibold text-base mb-1">Mit Dokument chatten</div>
                                <div className="text-xs text-muted-foreground">Fragen stellen</div>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                    <TabsTrigger value="content">Inhalt</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="quizzes">Quizze</TabsTrigger>
                    <TabsTrigger value="flashcards">Karteikarten</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-6 mt-4">
                    {/* Embedding Recovery Warning */}
                    {hasEmbeddingIssues && (
                        <Card className="bg-yellow-500/10 border-yellow-500/30">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                                            Fehlende Embeddings erkannt
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Einige Lernabschnitte haben keine Einbettungen. Dies kann die Funktionalität von Chat und Quiz beeinträchtigen.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRegenerateEmbeddings}
                                        disabled={regeneratingEmbeddings}
                                        className="shrink-0"
                                    >
                                        {regeneratingEmbeddings ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> Regeneriere...</>
                                        ) : (
                                            <><RefreshCw className="h-4 w-4" /> Embeddings regenerieren</>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Summary */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Zusammenfassung</h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleExtractTopics}
                                    disabled={extractingTopics}
                                >
                                    {extractingTopics ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Themen werden extrahiert...</>
                                    ) : (
                                        'Themen extrahieren'
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateSummary}
                                    disabled={generatingSummary}
                                >
                                    {generatingSummary ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Wird erstellt...</>
                                    ) : summaryText ? (
                                        'Neu generieren'
                                    ) : (
                                        'Zusammenfassung erstellen'
                                    )}
                                </Button>
                            </div>
                        </div>
                        {summaryText ? (
                            <Card>
                                <CardContent className="prose prose-sm dark:prose-invert max-w-none p-4">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {summaryText}
                                    </ReactMarkdown>
                                </CardContent>
                            </Card>
                        ) : !generatingSummary && (
                            <p className="text-sm text-muted-foreground">
                                Noch keine Zusammenfassung vorhanden. Klicke auf den Button, um eine KI-generierte Zusammenfassung zu erstellen.
                            </p>
                        )}
                    </div>

                    {/* Table of Contents */}
                    <Collapsible open={tocOpen} onOpenChange={setTocOpen}>
                        <div className="flex items-center justify-between">
                            <CollapsibleTrigger className="flex items-center gap-2 hover:text-foreground transition-colors">
                                {tocOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                <h2 className="text-lg font-semibold">Inhaltsverzeichnis</h2>
                                {tocSections.length > 0 && (
                                    <Badge variant="secondary">{tocSections.length}</Badge>
                                )}
                            </CollapsibleTrigger>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateToc}
                                disabled={generatingToc}
                            >
                                {generatingToc ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Wird erstellt...</>
                                ) : tocSections.length > 0 ? (
                                    'Neu generieren'
                                ) : (
                                    <><List className="h-4 w-4" /> Inhaltsverzeichnis erstellen</>
                                )}
                            </Button>
                        </div>
                        <CollapsibleContent className="mt-3">
                            {tocSections.length > 0 ? (
                                <Card>
                                    <CardContent className="p-3">
                                        <TableOfContents
                                            sections={tocSections}
                                            onNavigate={(chunkIndex) => chunkViewerRef.current?.scrollToChunk(chunkIndex)}
                                        />
                                    </CardContent>
                                </Card>
                            ) : !generatingToc && (
                                <p className="text-sm text-muted-foreground">
                                    Noch kein Inhaltsverzeichnis vorhanden. Klicke auf den Button, um eines zu erstellen.
                                </p>
                            )}
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Chunks */}
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Abschnitte</h2>
                        <ChunkViewer ref={chunkViewerRef} chunks={document.chunks} />
                    </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                    <ChatInterface documentId={params.id} />
                </TabsContent>

                <TabsContent value="quizzes" className="mt-4">
                    <DocumentQuizzesTab documentId={params.id} />
                </TabsContent>

                <TabsContent value="flashcards" className="mt-4">
                    <DocumentFlashcardsTab documentId={params.id} />
                </TabsContent>
            </Tabs>

            {/* Delete confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Lernmaterial löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Alle Abschnitte und zugehörige Daten werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Löschen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
