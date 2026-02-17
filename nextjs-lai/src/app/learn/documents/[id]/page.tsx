'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, Trash2, Pencil, ArrowLeft, Check, X, Loader2, ChevronDown, ChevronRight, List, MessageSquare, Brain, CreditCard, RefreshCw, Layers, MoreVertical, HelpCircle } from 'lucide-react'
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { getDocument, deleteDocument, renameDocument, hasChunksWithoutEmbeddings } from '@/src/actions/documents'
import { formatDate } from '@/src/lib/utils'
import { getCompetencies } from '@/src/app/learn/knowledge-map/actions'
import type { TopicCompetency } from '@/src/data-access/topics'

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
    const [topics, setTopics] = useState<TopicCompetency[]>([])
    const [loadingTopics, setLoadingTopics] = useState(true)

    const fetchDocument = useCallback(async () => {
        try {
            if (!params.id) {
                setError('Keine Dokument-ID gefunden.')
                setLoading(false)
                return
            }
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

            // Load topics for this document
            loadTopics()
        } catch (err) {
            console.error('Error loading document:', err)
            setError('Lernmaterial nicht gefunden.')
        } finally {
            setLoading(false)
        }
    }, [params.id])

    const loadTopics = async () => {
        if (!params.id) return
        setLoadingTopics(true)
        try {
            const competencies = await getCompetencies(params.id)
            setTopics(competencies)
        } catch (err) {
            console.error('Error loading topics:', err)
            setTopics([])
        } finally {
            setLoadingTopics(false)
        }
    }

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
            // Reload topics to show them immediately
            await loadTopics()
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={() => setShowDeleteDialog(true)}
                            className="text-destructive focus:text-destructive"
                            disabled={deleting}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleting ? 'Wird gelöscht...' : 'Dokument löschen'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line">
                    <TabsTrigger value="content" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Inhalt
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Chat
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Quizze
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="gap-2">
                        <CreditCard className="h-4 w-4" />
                        Karteikarten
                    </TabsTrigger>
                    <TabsTrigger value="topics" className="gap-2">
                        <Layers className="h-4 w-4" />
                        Themen
                    </TabsTrigger>
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
                    {activeTab === 'chat' && <ChatInterface documentId={params.id} />}
                </TabsContent>

                <TabsContent value="quizzes" className="mt-4">
                    {activeTab === 'quizzes' && <DocumentQuizzesTab documentId={params.id} />}
                </TabsContent>

                <TabsContent value="flashcards" className="mt-4">
                    {activeTab === 'flashcards' && <DocumentFlashcardsTab documentId={params.id} />}
                </TabsContent>

                <TabsContent value="topics" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-500/10">
                                <Layers className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Extrahierte Themen</h2>
                                <p className="text-sm text-muted-foreground">
                                    {topics.length > 0
                                        ? `${topics.length} Themen gefunden`
                                        : 'Extrahiere Themen für die Wissenslandkarte'
                                    }
                                </p>
                            </div>
                        </div>
                        <Button
                            variant={topics.length === 0 ? "default" : "outline"}
                            size="sm"
                            onClick={handleExtractTopics}
                            disabled={extractingTopics || loadingTopics}
                        >
                            {extractingTopics ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Extrahiere...</>
                            ) : topics.length > 0 ? (
                                <><RefreshCw className="h-4 w-4" /> Neu extrahieren</>
                            ) : (
                                <><Brain className="h-4 w-4" /> Themen extrahieren</>
                            )}
                        </Button>
                    </div>

                    {loadingTopics ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            <Skeleton className="h-24" />
                            <Skeleton className="h-24" />
                        </div>
                    ) : topics.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            {topics.map((topic) => (
                                <Card key={topic.id}>
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-medium text-sm flex-1">{topic.name}</h3>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    topic.status === 'Beherrscht'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : topic.status === 'Teilweise'
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }
                                            >
                                                {topic.status}
                                            </Badge>
                                        </div>
                                        {topic.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {topic.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="font-semibold text-foreground">{topic.score}%</span>
                                            {topic.quizScore !== null && <span>Quiz: {topic.quizScore}%</span>}
                                            {topic.flashcardScore !== null && <span>Karten: {topic.flashcardScore}%</span>}
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    topic.score >= 80
                                                        ? 'bg-green-500'
                                                        : topic.score >= 40
                                                            ? 'bg-yellow-500'
                                                            : 'bg-red-500'
                                                }`}
                                                style={{ width: `${topic.score}%` }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 space-y-3">
                            <div className="p-4 rounded-full bg-purple-500/10 w-16 h-16 mx-auto flex items-center justify-center">
                                <Layers className="h-8 w-8 text-purple-500" />
                            </div>
                            <div>
                                <p className="font-medium mb-1">Noch keine Themen extrahiert</p>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                    Klicke auf "Themen extrahieren", um KI-basierte Themen aus diesem Dokument zu extrahieren.
                                </p>
                            </div>
                        </div>
                    )}
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
