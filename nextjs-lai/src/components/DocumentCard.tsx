'use client'

import Link from 'next/link'
import { FileText, File, FileType, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'

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

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
    const Icon = getFileIcon(document.fileType)

    return (
        <Card>
            <CardHeader>
                <Link href={`/documents/${document.id}`} className="hover:underline">
                    <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary shrink-0" />
                        {document.title}
                    </CardTitle>
                </Link>
                <CardDescription>
                    {document.fileName && <span>{document.fileName} &middot; </span>}
                    {formatDate(document.createdAt)}
                </CardDescription>
                {onDelete && (
                    <CardAction>
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onDelete(document.id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </CardAction>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getFileLabel(document.fileType)}</Badge>
                    <Badge variant="outline">{document._count.chunks} Abschnitte</Badge>
                    {document.fileSize && (
                        <Badge variant="outline">{formatFileSize(document.fileSize)}</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
