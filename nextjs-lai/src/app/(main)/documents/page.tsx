'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { FileText, Plus, Search, Upload, FolderOpen, Loader2 } from 'lucide-react'
import { DocumentCard } from '@/src/components/DocumentCard'
import { DocumentUploader } from '@/src/components/DocumentUploader'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/src/components/ui/dialog'
import { getDocuments, searchDocuments, deleteDocument, renameDocument } from '@/src/actions/documents'

interface DocumentSummary {
    id: string
    title: string
    fileName: string | null
    fileType: string
    fileSize: number | null
    createdAt: string
    _count: { chunks: number }
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<DocumentSummary[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [searching, setSearching] = useState(false)
    const [uploadOpen, setUploadOpen] = useState(false)
    const [search, setSearch] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

    const fetchDocuments = useCallback(async () => {
        const data = await getDocuments()
        const docs = data as unknown as DocumentSummary[]
        setDocuments(docs)
        setTotalCount(docs.length)
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    // Debounced server-side search
    useEffect(() => {
        if (loading) return

        if (debounceRef.current) clearTimeout(debounceRef.current)

        if (!search.trim()) {
            // Reset to full list immediately
            fetchDocuments()
            setSearching(false)
            return
        }

        setSearching(true)
        debounceRef.current = setTimeout(async () => {
            const results = await searchDocuments(search)
            setDocuments(results as unknown as DocumentSummary[])
            setSearching(false)
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [search, loading, fetchDocuments])

    async function handleDelete(id: string) {
        if (!confirm('Dokument wirklich löschen? Alle Abschnitte werden ebenfalls gelöscht.')) return
        try {
            await deleteDocument(id)
            setDocuments((prev) => prev.filter((d) => d.id !== id))
            setTotalCount((prev) => prev - 1)
        } catch {
            alert('Löschen fehlgeschlagen.')
        }
    }

    async function handleRename(id: string, newTitle: string) {
        try {
            await renameDocument(id, newTitle)
            setDocuments((prev) =>
                prev.map((d) => (d.id === id ? { ...d, title: newTitle } : d))
            )
        } catch {
            alert('Umbenennen fehlgeschlagen.')
        }
    }

    function handleUploadSuccess(_documentId: string) {
        setUploadOpen(false)
        setSearch('')
        fetchDocuments()
    }

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Dokumente
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {totalCount === 0
                            ? 'Noch keine Dokumente vorhanden.'
                            : `${totalCount} Dokument${totalCount !== 1 ? 'e' : ''} vorhanden`}
                    </p>
                </div>
                <Button onClick={() => setUploadOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Hochladen
                </Button>
            </div>

            {/* Search - only show when documents exist */}
            {totalCount > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Titel, Dateiname oder Inhalt durchsuchen..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-9"
                    />
                    {searching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                    )}
                </div>
            )}

            {/* Document list */}
            {documents.length > 0 ? (
                <div className="grid gap-4">
                    {search.trim() && (
                        <p className="text-sm text-muted-foreground">
                            {documents.length} Treffer für &ldquo;{search}&rdquo;
                        </p>
                    )}
                    {documents.map((doc) => (
                        <DocumentCard
                            key={doc.id}
                            document={doc}
                            onDelete={handleDelete}
                            onRename={handleRename}
                        />
                    ))}
                </div>
            ) : search.trim() ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>Keine Dokumente gefunden für &ldquo;{search}&rdquo;</p>
                </div>
            ) : totalCount === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <div>
                        <p className="text-lg font-medium">Noch keine Dokumente</p>
                        <p className="text-muted-foreground mt-1">
                            Lade dein erstes Dokument hoch, um loszulegen.
                        </p>
                    </div>
                    <Button onClick={() => setUploadOpen(true)} size="lg">
                        <Upload className="h-4 w-4" />
                        Dokument hochladen
                    </Button>
                </div>
            ) : null}

            {/* Upload Dialog */}
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Dokument hochladen</DialogTitle>
                        <DialogDescription>
                            Lade eine Datei hoch oder füge Text ein, um ihn für Chat und Quiz zu verarbeiten.
                        </DialogDescription>
                    </DialogHeader>
                    <DocumentUploader onSuccess={handleUploadSuccess} />
                </DialogContent>
            </Dialog>
        </div>
    )
}
