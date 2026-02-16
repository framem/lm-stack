'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import {
    Settings,
    FileText,
    BookOpen,
    FileCode2,
    Loader2,
    CheckCircle2,
    XCircle,
    SkipForward,
    RefreshCw,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Skeleton } from '@/src/components/ui/skeleton'
import {
    PipelineProgress,
    createSteps,
    advanceStep,
    completeSteps,
    type PipelineStep,
} from '@/src/components/PipelineProgress'

const IMPORT_STEP_DEFS = [
    { key: 'document', label: 'Datei lesen' },
    { key: 'chunking', label: 'Abschnitte vorbereiten' },
    { key: 'embedding', label: 'Abschnitte einbetten' },
]

const IMPORT_STEP_MAP: Record<string, string> = {
    document: 'document',
    chunking: 'chunking',
    embedding: 'embedding',
}

const REFRESH_STEP_DEFS = [
    { key: 'cleanup', label: 'Alte Chunks entfernen' },
    { key: 'chunking', label: 'Abschnitte vorbereiten' },
    { key: 'embedding', label: 'Abschnitte einbetten' },
]

const REFRESH_STEP_MAP: Record<string, string> = {
    cleanup: 'cleanup',
    chunking: 'chunking',
    embedding: 'embedding',
}

interface RefreshableDoc {
    id: string
    title: string
    fileName: string | null
    _count: { chunks: number }
}

interface RefreshResult {
    id: string
    title: string
    status: 'refreshed' | 'error'
    error?: string
}

interface ScannedFile {
    relativePath: string
    fileName: string
    sizeBytes: number
    category: 'docs' | 'notebooks'
    alreadyImported: boolean
}

interface ImportResult {
    file: string
    status: 'imported' | 'skipped' | 'error'
    error?: string
}

type Phase = 'idle' | 'importing' | 'done'

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(0)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
}

export default function AdminPage() {
    const [files, setFiles] = useState<ScannedFile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selected, setSelected] = useState<Set<string>>(new Set())

    // Import state
    const [phase, setPhase] = useState<Phase>('idle')
    const [currentFile, setCurrentFile] = useState('')
    const [importFileIndex, setImportFileIndex] = useState(0)
    const [importFileTotal, setImportFileTotal] = useState(0)
    const [importSteps, setImportSteps] = useState<PipelineStep[]>([])
    const importStepTimesRef = useRef<Record<string, number>>({})
    const [results, setResults] = useState<ImportResult[]>([])

    // Refresh state
    const [refreshDocs, setRefreshDocs] = useState<RefreshableDoc[]>([])
    const [refreshSelected, setRefreshSelected] = useState<Set<string>>(new Set())
    const [refreshPhase, setRefreshPhase] = useState<Phase>('idle')
    const [refreshCurrentDoc, setRefreshCurrentDoc] = useState('')
    const [refreshDocIndex, setRefreshDocIndex] = useState(0)
    const [refreshDocTotal, setRefreshDocTotal] = useState(0)
    const [refreshSteps, setRefreshSteps] = useState<PipelineStep[]>([])
    const refreshStepTimesRef = useRef<Record<string, number>>({})
    const [refreshResults, setRefreshResults] = useState<RefreshResult[]>([])

    const fetchFiles = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/scan')
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Scan fehlgeschlagen')
            }
            const data = await res.json()
            setFiles(data.files)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Scan fehlgeschlagen')
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchRefreshDocs = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/refresh')
            if (!res.ok) return
            const data = await res.json()
            setRefreshDocs(data.documents)
        } catch {
            // non-critical, ignore
        }
    }, [])

    useEffect(() => {
        fetchFiles()
        fetchRefreshDocs()
    }, [fetchFiles, fetchRefreshDocs])

    const selectableFiles = files.filter(f => !f.alreadyImported)
    const docsFiles = files.filter(f => f.category === 'docs')
    const notebookFiles = files.filter(f => f.category === 'notebooks')

    function toggleFile(relativePath: string) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(relativePath)) next.delete(relativePath)
            else next.add(relativePath)
            return next
        })
    }

    function toggleAll() {
        if (selected.size === selectableFiles.length) {
            setSelected(new Set())
        } else {
            setSelected(new Set(selectableFiles.map(f => f.relativePath)))
        }
    }

    function toggleGroup(paths: string[]) {
        setSelected(prev => {
            const next = new Set(prev)
            const allIn = paths.every(p => next.has(p))
            if (allIn) {
                paths.forEach(p => next.delete(p))
            } else {
                paths.forEach(p => next.add(p))
            }
            return next
        })
    }

    async function startImport() {
        if (selected.size === 0) return
        setPhase('importing')
        setResults([])
        setCurrentFile('')
        setImportSteps([])
        setImportFileIndex(0)
        setImportFileTotal(0)

        const filesToImport = Array.from(selected)

        try {
            const res = await fetch('/api/admin/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: filesToImport }),
            })

            if (!res.ok || !res.body) {
                setPhase('done')
                setResults([{ file: 'batch', status: 'error', error: 'Verbindung fehlgeschlagen' }])
                return
            }

            const reader = res.body.getReader()
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
                    try {
                        const event = JSON.parse(line.slice(6))

                        switch (event.type) {
                            case 'file_start':
                                setCurrentFile(event.file)
                                setImportFileIndex(event.index + 1)
                                setImportFileTotal(event.total)
                                setImportSteps(createSteps(IMPORT_STEP_DEFS))
                                importStepTimesRef.current = {}
                                break
                            case 'progress': {
                                const key = IMPORT_STEP_MAP[event.step]
                                if (key) {
                                    const detail = event.step === 'embedding' ? event.detail : undefined
                                    setImportSteps(prev => advanceStep(prev, key, detail, importStepTimesRef.current))
                                }
                                break
                            }
                            case 'file_complete':
                                setImportSteps(prev => completeSteps(prev, importStepTimesRef.current))
                                setResults(prev => [...prev, { file: event.file, status: 'imported' }])
                                break
                            case 'file_skip':
                                setResults(prev => [...prev, { file: event.file, status: 'skipped' }])
                                break
                            case 'file_error':
                                setResults(prev => [...prev, { file: event.file, status: 'error', error: event.error }])
                                break
                            case 'batch_complete': {
                                setCurrentFile('')
                                const imported = (event.results as ImportResult[]).filter((r: ImportResult) => r.status === 'imported').length
                                if (imported > 0) {
                                    toast.success(`${imported} Datei${imported !== 1 ? 'en' : ''} erfolgreich importiert!`)
                                }
                                break
                            }
                        }
                    } catch {
                        // ignore malformed SSE lines
                    }
                }
            }
        } catch (err) {
            console.error('Import stream error:', err)
        } finally {
            setPhase('done')
        }
    }

    function resetImport() {
        setPhase('idle')
        setResults([])
        setSelected(new Set())
        setImportSteps([])
        setLoading(true)
        fetchFiles()
    }

    function toggleRefreshDoc(id: string) {
        setRefreshSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function toggleRefreshAll() {
        if (refreshSelected.size === refreshDocs.length) {
            setRefreshSelected(new Set())
        } else {
            setRefreshSelected(new Set(refreshDocs.map(d => d.id)))
        }
    }

    async function startRefresh() {
        if (refreshSelected.size === 0) return
        setRefreshPhase('importing')
        setRefreshResults([])
        setRefreshCurrentDoc('')
        setRefreshSteps([])
        setRefreshDocIndex(0)
        setRefreshDocTotal(0)

        try {
            const res = await fetch('/api/admin/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentIds: Array.from(refreshSelected) }),
            })

            if (!res.ok || !res.body) {
                setRefreshPhase('done')
                setRefreshResults([{ id: '', title: 'batch', status: 'error', error: 'Verbindung fehlgeschlagen' }])
                return
            }

            const reader = res.body.getReader()
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
                    try {
                        const event = JSON.parse(line.slice(6))

                        switch (event.type) {
                            case 'doc_start':
                                setRefreshCurrentDoc(event.title)
                                setRefreshDocIndex(event.index + 1)
                                setRefreshDocTotal(event.total)
                                setRefreshSteps(createSteps(REFRESH_STEP_DEFS))
                                refreshStepTimesRef.current = {}
                                break
                            case 'progress': {
                                const key = REFRESH_STEP_MAP[event.step]
                                if (key) {
                                    const detail = event.step === 'embedding' ? event.detail : undefined
                                    setRefreshSteps(prev => advanceStep(prev, key, detail, refreshStepTimesRef.current))
                                }
                                break
                            }
                            case 'doc_complete':
                                setRefreshSteps(prev => completeSteps(prev, refreshStepTimesRef.current))
                                setRefreshResults(prev => [...prev, { id: event.id, title: event.title, status: 'refreshed' }])
                                break
                            case 'doc_error':
                                setRefreshResults(prev => [...prev, { id: event.id, title: event.title || event.id, status: 'error', error: event.error }])
                                break
                            case 'batch_complete': {
                                setRefreshCurrentDoc('')
                                const refreshed = (event.results as RefreshResult[]).filter((r: RefreshResult) => r.status === 'refreshed').length
                                if (refreshed > 0) {
                                    toast.success(`${refreshed} Dokument${refreshed !== 1 ? 'e' : ''} erfolgreich aktualisiert!`)
                                }
                                break
                            }
                        }
                    } catch {
                        // ignore malformed SSE lines
                    }
                }
            }
        } catch (err) {
            console.error('Refresh stream error:', err)
        } finally {
            setRefreshPhase('done')
        }
    }

    function resetRefresh() {
        setRefreshPhase('idle')
        setRefreshResults([])
        setRefreshSelected(new Set())
        setRefreshSteps([])
        fetchRefreshDocs()
    }

    if (loading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
                <div className="space-y-3 mt-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    Admin
                </h1>
                <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                    {error}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    Admin
                </h1>
                <p className="text-muted-foreground mt-1">
                    Lokales Lernmaterial importieren
                </p>
            </div>

            {/* Import progress */}
            {phase === 'importing' && (
                <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {importFileTotal > 0
                            ? `Datei ${importFileIndex} von ${importFileTotal}`
                            : 'Importiere...'}
                    </div>
                    {currentFile && (
                        <p className="text-sm text-muted-foreground truncate">
                            {currentFile}
                        </p>
                    )}
                    {importSteps.length > 0 && <PipelineProgress steps={importSteps} />}
                </div>
            )}

            {/* Results */}
            {phase === 'done' && results.length > 0 && (
                <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Import abgeschlossen</p>
                        <Button variant="outline" size="sm" onClick={resetImport}>
                            Zurück
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {results.map((r) => (
                            <div key={r.file} className="flex items-center gap-2 text-sm">
                                {r.status === 'imported' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                                {r.status === 'skipped' && <SkipForward className="h-4 w-4 text-yellow-500 shrink-0" />}
                                {r.status === 'error' && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                                <span className="truncate">{r.file}</span>
                                {r.status === 'skipped' && (
                                    <Badge variant="secondary" className="text-xs">Übersprungen</Badge>
                                )}
                                {r.status === 'error' && (
                                    <Badge variant="destructive" className="text-xs">{r.error}</Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Refresh section ── */}
            {refreshDocs.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            Lernabschnitte aktualisieren
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Lernabschnitte neu erstellen und aufbereiten
                        </p>
                    </div>

                    {/* Refresh progress */}
                    {refreshPhase === 'importing' && (
                        <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {refreshDocTotal > 0
                                    ? `Dokument ${refreshDocIndex} von ${refreshDocTotal}`
                                    : 'Aktualisiere...'}
                            </div>
                            {refreshCurrentDoc && (
                                <p className="text-sm text-muted-foreground truncate">
                                    {refreshCurrentDoc}
                                </p>
                            )}
                            {refreshSteps.length > 0 && <PipelineProgress steps={refreshSteps} />}
                        </div>
                    )}

                    {/* Refresh results */}
                    {refreshPhase === 'done' && refreshResults.length > 0 && (
                        <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Aktualisierung abgeschlossen</p>
                                <Button variant="outline" size="sm" onClick={resetRefresh}>
                                    Zurück
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {refreshResults.map((r) => (
                                    <div key={r.id} className="flex items-center gap-2 text-sm">
                                        {r.status === 'refreshed' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                                        {r.status === 'error' && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                                        <span className="truncate">{r.title}</span>
                                        {r.status === 'error' && (
                                            <Badge variant="destructive" className="text-xs">{r.error}</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Refresh document list */}
                    {refreshPhase === 'idle' && (
                        <>
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={toggleRefreshAll}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {refreshSelected.size === refreshDocs.length && refreshDocs.length > 0
                                        ? 'Auswahl aufheben'
                                        : 'Alle auswählen'}
                                </button>
                                <Button
                                    onClick={startRefresh}
                                    disabled={refreshSelected.size === 0}
                                    variant="secondary"
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    {refreshSelected.size > 0
                                        ? `${refreshSelected.size} Lernmaterial${refreshSelected.size !== 1 ? 'ien' : ''} aktualisieren`
                                        : 'Lernmaterial auswählen'}
                                </Button>
                            </div>
                            <div className="rounded-lg border divide-y">
                                {refreshDocs.map((doc) => (
                                    <label
                                        key={doc.id}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                                    >
                                        <Checkbox
                                            checked={refreshSelected.has(doc.id)}
                                            onCheckedChange={() => toggleRefreshDoc(doc.id)}
                                        />
                                        <span className="flex-1 text-sm truncate">{doc.title}</span>
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            {doc._count.chunks} Chunks
                                        </Badge>
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <hr className="border-border" />

            {/* File list (hidden during import) */}
            {phase === 'idle' && (
                <>
                    {files.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <FileText className="h-16 w-16 mx-auto mb-3 opacity-50" />
                            <p>Keine Markdown-Dateien gefunden.</p>
                        </div>
                    ) : (
                        <>
                            {/* Action bar */}
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={toggleAll}
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {selected.size === selectableFiles.length && selectableFiles.length > 0
                                        ? 'Auswahl aufheben'
                                        : 'Alle auswählen'}
                                </button>
                                <Button
                                    onClick={startImport}
                                    disabled={selected.size === 0}
                                >
                                    {selected.size > 0
                                        ? `${selected.size} Datei${selected.size !== 1 ? 'en' : ''} importieren`
                                        : 'Dateien auswählen'}
                                </Button>
                            </div>

                            {/* Docs category */}
                            {docsFiles.length > 0 && (
                                <FileGroup
                                    label="Lernmaterialien"
                                    icon={<BookOpen className="h-4 w-4" />}
                                    files={docsFiles}
                                    selected={selected}
                                    onToggle={toggleFile}
                                    onToggleGroup={toggleGroup}
                                />
                            )}

                            {/* Notebooks category */}
                            {notebookFiles.length > 0 && (
                                <FileGroup
                                    label="Notebooks"
                                    icon={<FileCode2 className="h-4 w-4" />}
                                    files={notebookFiles}
                                    selected={selected}
                                    onToggle={toggleFile}
                                    onToggleGroup={toggleGroup}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    )
}

function FileGroup({
    label,
    icon,
    files,
    selected,
    onToggle,
    onToggleGroup,
}: {
    label: string
    icon: React.ReactNode
    files: ScannedFile[]
    selected: Set<string>
    onToggle: (path: string) => void
    onToggleGroup: (paths: string[]) => void
}) {
    const selectable = files.filter(f => !f.alreadyImported)
    const selectedCount = selectable.filter(f => selected.has(f.relativePath)).length
    const allSelected = selectable.length > 0 && selectedCount === selectable.length
    const someSelected = selectedCount > 0 && !allSelected

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <Checkbox
                    checked={someSelected ? 'indeterminate' : allSelected}
                    disabled={selectable.length === 0}
                    onCheckedChange={() => onToggleGroup(selectable.map(f => f.relativePath))}
                />
                {icon}
                {label}
            </label>
            <div className="rounded-lg border divide-y">
                {files.map((file) => (
                    <label
                        key={file.relativePath}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                            file.alreadyImported
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-muted/50 cursor-pointer'
                        }`}
                    >
                        <Checkbox
                            checked={selected.has(file.relativePath)}
                            disabled={file.alreadyImported}
                            onCheckedChange={() => onToggle(file.relativePath)}
                        />
                        <span className="flex-1 text-sm truncate">{file.fileName}</span>
                        <Badge variant="secondary" className="text-xs font-normal">
                            {formatSize(file.sizeBytes)}
                        </Badge>
                        {file.alreadyImported && (
                            <Badge variant="outline" className="text-xs">Importiert</Badge>
                        )}
                    </label>
                ))}
            </div>
        </div>
    )
}
