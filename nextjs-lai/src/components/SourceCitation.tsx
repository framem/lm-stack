'use client'

import { FileText } from 'lucide-react'

interface SourceCitationProps {
    index: number
    documentTitle: string
    pageNumber: number | null
    active?: boolean
    onClick?: () => void
}

// Compact citation badge for inline display below messages
export function SourceCitation({ index, documentTitle, pageNumber, active, onClick }: SourceCitationProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
                active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:bg-accent text-foreground'
            }`}
        >
            <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                {index}
            </span>
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="truncate max-w-[140px]">{documentTitle}</span>
            {pageNumber != null && (
                <span className="text-muted-foreground">S.{pageNumber}</span>
            )}
        </button>
    )
}
