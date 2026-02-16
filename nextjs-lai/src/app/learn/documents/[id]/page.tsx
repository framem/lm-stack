'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, Trash2, Pencil, ArrowLeft, Check, X, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardContent } from '@/src/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/src/components/ui/tabs'
import { ChunkViewer } from '@/src/components/ChunkViewer'
import { ChatInterface } from '@/src/components/ChatInterface'
import { DocumentQuizzesTab } from '@/src/components/DocumentQuizzesTab'
import { DocumentFlashcardsTab } from '@/src/components/DocumentFlashcardsTab'
import { Skeleton } from '@/src/components/ui/skeleton'
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
import { getDocument, deleteDocument, renameDocument } from '@/src/actions/documents'
import { formatDate } from '@/src/lib/utils'

interface DocumentDetail {
    id: string
    title: string
    fileName: string | null
    fileType: string
    fileSize: number | null
    content: string
    summary: string | null
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

    const fetchDocument = useCallback(async () => {
        try {
            const data = await getDocument(params.id)
            setDocument(data as unknown as DocumentDetail)
            if ((data as unknown as DocumentDetail)?.summary) {
                setSummaryText((data as unknown as DocumentDetail).summary!)
            }
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

            {/* Tabs */}
            <Tabs defaultValue="content">
                <TabsList variant="line">
                    <TabsTrigger value="content">Inhalt</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="quizzes">Quizze</TabsTrigger>
                    <TabsTrigger value="flashcards">Karteikarten</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-6 mt-4">
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

                    {/* Chunks */}
                    <div>
                        <h2 className="text-lg font-semibold mb-3">Abschnitte</h2>
                        <ChunkViewer chunks={document.chunks} />
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
