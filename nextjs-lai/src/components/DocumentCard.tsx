'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, File, FileType, Trash2, Pencil, Check, X, Calendar, Layers, Wand2, Loader2 } from 'lucide-react'
import { Card } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { suggestTitle } from '@/src/actions/documents'
import { formatDateTime } from '@/src/lib/utils'

interface DocumentCardProps {
    document: {
        id: string
        title: string
        fileName: string | null
        fileType: string
        fileSize: number | null
        createdAt: string
        _count: { chunks: number }
    }
    onDelete?: (id: string) => void
    onRename?: (id: string, newTitle: string) => void
}

function getFileIcon(fileType: string) {
    if (fileType === 'application/pdf') return FileType
    if (fileType.includes('wordprocessingml')) return File
    return FileText
}

function getFileLabel(fileType: string) {
    if (fileType === 'application/pdf') return 'PDF'
    if (fileType.includes('wordprocessingml')) return 'DOCX'
    if (fileType === 'text/markdown') return 'MD'
    return 'TXT'
}

function formatFileSize(bytes: number | null) {
    if (!bytes) return null
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Display title: replace underscores with spaces for readability
function displayTitle(title: string) {
    return title.replace(/_/g, ' ')
}

// Check if fileName is redundant with title (title derived from fileName)
function isFileNameRedundant(title: string, fileName: string | null) {
    if (!fileName) return true
    const nameWithoutExt = fileName.replace(/\.[^.]+$/, '')
    return title === nameWithoutExt || title === fileName
}

export function DocumentCard({ document, onDelete, onRename }: DocumentCardProps) {
    const Icon = getFileIcon(document.fileType)
    const [editing, setEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(document.title)
    const [suggesting, setSuggesting] = useState(false)

    const showFileName = !isFileNameRedundant(document.title, document.fileName)
    const size = formatFileSize(document.fileSize)

    async function handleSuggest() {
        setSuggesting(true)
        try {
            const suggested = await suggestTitle(editTitle)
            setEditTitle(suggested)
        } catch {
            // Silently fail — user can still edit manually
        } finally {
            setSuggesting(false)
        }
    }

    function handleRenameSubmit() {
        const trimmed = editTitle.trim()
        if (!trimmed || trimmed === document.title) {
            setEditing(false)
            setEditTitle(document.title)
            return
        }
        onRename?.(document.id, trimmed)
        setEditing(false)
    }

    return (
        <Card className="gap-0 py-0 transition-colors hover:bg-accent/30">
            <div className="p-4 space-y-2.5">
                {/* Top row: icon + title + actions */}
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                    </div>

                    {editing ? (
                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSubmit()
                                    if (e.key === 'Escape') {
                                        setEditing(false)
                                        setEditTitle(document.title)
                                    }
                                }}
                                autoFocus
                                disabled={suggesting}
                                className="h-8"
                            />
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={handleSuggest}
                                disabled={suggesting}
                                title="Titel mit KI bereinigen"
                            >
                                {suggesting
                                    ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    : <Wand2 className="h-4 w-4 text-primary" />
                                }
                            </Button>
                            <Button variant="ghost" size="icon-xs" onClick={handleRenameSubmit}>
                                <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => { setEditing(false); setEditTitle(document.title) }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Link
                                href={`/learn/documents/${document.id}`}
                                className="group block min-w-0 flex-1"
                            >
                                <p
                                    className="line-clamp-2 font-medium group-hover:underline break-words"
                                    title={document.title}
                                >
                                    {displayTitle(document.title)}
                                </p>
                            </Link>

                            {/* Action buttons — always visible, minimal space */}
                            {(onRename || onDelete) && (
                                <div className="flex shrink-0 items-center gap-0.5">
                                    {onRename && (
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => setEditing(true)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    {onDelete && (
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => onDelete(document.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Bottom row: metadata + badges — wraps naturally on mobile */}
                {!editing && (
                    <div className="flex flex-wrap items-center gap-2 pl-12">
                        <Badge variant="secondary" className="text-xs">
                            {getFileLabel(document.fileType)}
                        </Badge>
                        {size && (
                            <Badge variant="outline" className="text-xs">
                                {size}
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                            <Layers className="h-3 w-3" />
                            {document._count.chunks} Abschnitte
                        </Badge>
                        {showFileName && (
                            <span className="truncate max-w-48 text-xs text-muted-foreground" title={document.fileName!}>
                                {document.fileName}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(document.createdAt)}
                        </span>
                    </div>
                )}
            </div>
        </Card>
    )
}
