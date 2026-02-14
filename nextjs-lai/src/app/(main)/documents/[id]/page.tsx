'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileText, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { ChunkViewer } from '@/src/components/ChunkViewer'
import { Skeleton } from '@/src/components/ui/skeleton'

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

    const fetchDocument = useCallback(async () => {
        try {
            const res = await fetch(`/api/documents/${params.id}`)
            if (!res.ok) {
                if (res.status === 404) {
                    setError('Dokument nicht gefunden.')
                } else {
                    setError('Fehler beim Laden des Dokuments.')
                }
                return
            }
            const data = await res.json()
            setDocument(data)
        } catch {
            setError('Verbindungsfehler.')
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
            const res = await fetch(`/api/documents/${params.id}`, { method: 'DELETE' })
            if (res.ok) {
                router.push('/upload')
            } else {
                setError('Löschen fehlgeschlagen.')
                setDeleting(false)
            }
        } catch {
            setError('Verbindungsfehler beim Löschen.')
            setDeleting(false)
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
                <Button variant="outline" onClick={() => router.push('/upload')}>
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
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        {document.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        {document.fileName && (
                            <Badge variant="outline">{document.fileName}</Badge>
                        )}
                        <Badge variant="secondary">{document.chunks.length} Abschnitte</Badge>
                        <span className="text-sm text-muted-foreground">
                            {new Date(document.createdAt).toLocaleDateString('de-DE')}
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

            <div>
                <h2 className="text-lg font-semibold mb-3">Abschnitte</h2>
                <ChunkViewer chunks={document.chunks} />
            </div>
        </div>
    )
}
