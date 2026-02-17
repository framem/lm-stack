'use client'

import { useState, useCallback, useTransition, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText, Plus, Search, FolderOpen, Loader2, HelpCircle, Layers, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { DocumentCard } from '@/src/components/DocumentCard'
import { DocumentUploader } from '@/src/components/DocumentUploader'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
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
import { deleteDocument, renameDocument } from '@/src/actions/documents'

export interface DocumentSummary {
    id: string
    title: string
    fileName: string | null
    fileType: string
    fileSize: number | null
    createdAt: string
    subject?: string | null
    tags?: string[]
    summary?: string | null
    _count: { chunks: number }
}

interface DocumentsClientProps {
    documents: DocumentSummary[]
    subjects: string[]
    totalCount: number
}

export function DocumentsClient({ documents, subjects, totalCount }: DocumentsClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [uploadOpen, setUploadOpen] = useState(false)
    const [postUploadDocId, setPostUploadDocId] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

    const searchQuery = searchParams.get('search') ?? ''
    const activeSubject = searchParams.get('subject')

    // Local state for search input (for instant UI feedback)
    const [searchInput, setSearchInput] = useState(searchQuery)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Sync search input when URL changes (e.g., back button)
    useEffect(() => {
        setSearchInput(searchQuery)
    }, [searchQuery])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [])

    // Update URL with new search/filter params
    const updateSearchParams = useCallback((key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        startTransition(() => {
            router.push(`/learn/documents?${params.toString()}`, { scroll: false })
        })
    }, [router, searchParams])

    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value)

        // Clear existing timeout
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        // Debounce URL update
        debounceRef.current = setTimeout(() => {
            updateSearchParams('search', value || null)
        }, 300)
    }, [updateSearchParams])

    const handleSubjectChange = useCallback((subject: string | null) => {
        updateSearchParams('subject', subject)
    }, [updateSearchParams])

    function handleDelete(id: string) {
        setDeleteTarget(id)
    }

    async function confirmDelete() {
        if (!deleteTarget) return
        try {
            await deleteDocument(deleteTarget)
            toast.success('Lernmaterial gelöscht.')
            router.refresh()
        } catch {
            toast.error('Löschen fehlgeschlagen.')
        } finally {
            setDeleteTarget(null)
        }
    }

    async function handleRename(id: string, newTitle: string) {
        try {
            await renameDocument(id, newTitle)
            toast.success('Titel aktualisiert.')
            router.refresh()
        } catch {
            toast.error('Umbenennen fehlgeschlagen.')
        }
    }

    function handleUploadSuccess(documentId: string) {
        setUploadOpen(false)
        // Clear search/filters
        router.push('/learn/documents')
        router.refresh()
        setPostUploadDocId(documentId)
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Lernmaterial
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {totalCount === 0
                            ? 'Noch kein Lernmaterial vorhanden.'
                            : `${totalCount} Lernmaterial${totalCount !== 1 ? 'ien' : ''} vorhanden`}
                    </p>
                </div>
                <Button onClick={() => setUploadOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Anlegen
                </Button>
            </div>

            {/* Search - only show when documents exist */}
            {totalCount > 0 && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Titel, Dateiname oder Inhalt durchsuchen..."
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9 pr-9"
                    />
                    {isPending && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                    )}
                </div>
            )}

            {/* Subject filter chips */}
            {subjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => handleSubjectChange(null)}
                        disabled={isPending}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                            !activeSubject ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                    >
                        Alle
                    </button>
                    {subjects.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => handleSubjectChange(activeSubject === s ? null : s)}
                            disabled={isPending}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                                activeSubject === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Document list */}
            {documents.length > 0 ? (
                <div className="grid gap-4">
                    {searchQuery.trim() && (
                        <p className="text-sm text-muted-foreground">
                            {documents.length} Treffer für &ldquo;{searchQuery}&rdquo;
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
            ) : searchQuery.trim() || activeSubject ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>
                        Kein Lernmaterial gefunden
                        {searchQuery.trim() && ` für "${searchQuery}"`}
                        {activeSubject && ` in "${activeSubject}"`}
                    </p>
                </div>
            ) : totalCount === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <div>
                        <p className="text-lg font-medium">Noch kein Lernmaterial</p>
                        <p className="text-muted-foreground mt-1">
                            Lade dein erstes Lernmaterial hoch, um loszulegen.
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Upload Dialog */}
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Lernmaterial anlegen</DialogTitle>
                        <DialogDescription>
                            Lade eine Datei hoch oder füge Text ein, um damit zu lernen.
                        </DialogDescription>
                    </DialogHeader>
                    <DocumentUploader onSuccess={handleUploadSuccess} />
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Lernmaterial löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Alle Abschnitte und zugehörige Daten werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
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

            {/* Post-upload CTA */}
            <Dialog open={!!postUploadDocId} onOpenChange={(open) => { if (!open) setPostUploadDocId(null) }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                        <DialogTitle className="text-center">Dokument verarbeitet!</DialogTitle>
                        <DialogDescription className="text-center">
                            Dein Lernmaterial wurde erfolgreich verarbeitet. Was möchtest du als nächstes tun?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 pt-2">
                        <Button
                            variant="default"
                            className="w-full justify-start gap-3 h-auto py-3"
                            onClick={() => {
                                router.push(`/learn/quiz?generate=${postUploadDocId}`)
                                setPostUploadDocId(null)
                            }}
                        >
                            <HelpCircle className="h-5 w-5 shrink-0" />
                            <div className="text-left">
                                <div className="font-semibold">Quiz erstellen</div>
                                <div className="text-xs opacity-80">Wissen mit automatisch generierten Fragen testen</div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-auto py-3"
                            onClick={() => {
                                router.push(`/learn/flashcards?generate=${postUploadDocId}`)
                                setPostUploadDocId(null)
                            }}
                        >
                            <Layers className="h-5 w-5 shrink-0" />
                            <div className="text-left">
                                <div className="font-semibold">Karteikarten generieren</div>
                                <div className="text-xs text-muted-foreground">Automatisch Karteikarten aus dem Dokument erstellen</div>
                            </div>
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={() => {
                                router.push(`/learn/documents/${postUploadDocId}`)
                                setPostUploadDocId(null)
                            }}
                        >
                            Dokument ansehen
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
