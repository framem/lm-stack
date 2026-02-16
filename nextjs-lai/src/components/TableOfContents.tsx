'use client'

import { List } from 'lucide-react'

interface TocSection {
    title: string
    level: number
    startChunkIndex: number
}

interface TableOfContentsProps {
    sections: TocSection[]
    onNavigate?: (chunkIndex: number) => void
}

export function TableOfContents({ sections, onNavigate }: TableOfContentsProps) {
    if (sections.length === 0) return null

    return (
        <nav className="space-y-1">
            {sections.map((section, i) => (
                <button
                    key={i}
                    type="button"
                    onClick={() => onNavigate?.(section.startChunkIndex)}
                    className="flex items-center gap-2 w-full text-left rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-foreground text-muted-foreground"
                    style={{ paddingLeft: `${(section.level - 1) * 16 + 12}px` }}
                >
                    {section.level === 1 && <List className="h-3.5 w-3.5 shrink-0" />}
                    <span className={section.level === 1 ? 'font-medium text-foreground' : ''}>
                        {section.title}
                    </span>
                </button>
            ))}
        </nav>
    )
}
