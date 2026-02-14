'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Trash2, Pencil, ArrowLeft, Check, X, MessageSquare, HelpCircle } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { ChunkViewer } from '@/src/components/ChunkViewer'
import { Skeleton } from '@/src/components/ui/skeleton'
import { getDocument, deleteDocument, renameDocument } from '@/src/actions/documents'
import { formatDate } from '@/src/lib/utils'

interface DocumentDetail {
    id: string
    title: string
    fileName: string | null
    fileType: string
    fileSize: number | null
    content: string
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

    const fetchDocument = useCallback(async () => {
        try {
            const data = await getDocument(params.id)
            setDocument(data as unknown as DocumentDetail)
        } catch {
            setError('Dokument nicht gefunden.')
        } finally {
            setLoading(false)
        }
    }, [params.id])

    useEffect(() => {
        fetchDocument()
    }, [fetchDocument])

    async function handleDelete() {
        if (!confirm('Dokument wirklich löschen? Alle Abschnitte werden ebenfalls gelöscht.')) return
        setDeleting(true)
        try {
            await deleteDocument(params.id)
            router.push('/learn/documents')
        } catch {
            setError('Löschen fehlgeschlagen.')
            setDeleting(false)
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
            setError('Umbenennen fehlgeschlagen.')
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
                <p className="text-destructive">{error || 'Dokument nicht gefunden.'}</p>
                <Button variant="outline" onClick={() => router.push('/learn/documents')}>
                    <ArrowLeft className="h-4 w-4" />
                    Zurück
                </Button>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
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
                    onClick={handleDelete}
                    disabled={deleting}
                >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? 'Wird gelöscht...' : 'Löschen'}
                </Button>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-3">
                <Button asChild>
                    <Link href={`/learn/chat?documentId=${params.id}`}>
                        <MessageSquare className="h-4 w-4" />
                        Chat starten
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href={`/learn/quiz?documentId=${params.id}`}>
                        <HelpCircle className="h-4 w-4" />
                        Quiz generieren
                    </Link>
                </Button>
            </div>

            <div>
                <h2 className="text-lg font-semibold mb-3">Abschnitte</h2>
                <ChunkViewer chunks={document.chunks} />
            </div>
        </div>
    )
}
