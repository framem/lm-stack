'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { BookPlus } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { VocabLookupDialog } from '@/src/components/VocabLookupDialog'

interface VocabExtractPopoverProps {
    children: ReactNode
    documentId: string
    defaultLanguage?: string
    chunks?: { id: string; content: string; chunkIndex: number }[]
}

interface SelectionInfo {
    text: string
    x: number
    y: number
    chunkId?: string
    chunkContent?: string
}

export function VocabExtractPopover({
    children,
    documentId,
    defaultLanguage,
    chunks,
}: VocabExtractPopoverProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [selection, setSelection] = useState<SelectionInfo | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogWord, setDialogWord] = useState('')
    const [dialogChunkId, setDialogChunkId] = useState<string | undefined>()
    const [dialogContext, setDialogContext] = useState<string | undefined>()

    const handleMouseUp = useCallback(() => {
        // Small delay to let the browser finalize the selection
        requestAnimationFrame(() => {
            const sel = window.getSelection()
            if (!sel || sel.isCollapsed || !sel.rangeCount) {
                setSelection(null)
                return
            }

            const text = sel.toString().trim()
            if (!text || text.length > 100) {
                setSelection(null)
                return
            }

            // Check that selection is within our container
            const range = sel.getRangeAt(0)
            if (!containerRef.current?.contains(range.commonAncestorContainer)) {
                setSelection(null)
                return
            }

            // Get position for the floating button
            const rect = range.getBoundingClientRect()
            const containerRect = containerRef.current.getBoundingClientRect()

            // Find which chunk the selection is in
            let chunkId: string | undefined
            let chunkContent: string | undefined
            const node = range.startContainer.parentElement
            if (node && chunks) {
                const chunkCard = node.closest('[data-chunk-id]')
                if (chunkCard) {
                    const id = chunkCard.getAttribute('data-chunk-id')
                    if (id) {
                        chunkId = id
                        const chunk = chunks.find(c => c.id === id)
                        chunkContent = chunk?.content
                    }
                }
            }

            setSelection({
                text,
                x: rect.left + rect.width / 2 - containerRect.left,
                y: rect.top - containerRect.top - 8,
                chunkId,
                chunkContent,
            })
        })
    }, [chunks])

    // Clear selection when clicking outside or pressing Escape
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            const target = e.target as HTMLElement
            if (target.closest('[data-vocab-popover]')) return
            // Clear only if the click is outside the selection itself
            const sel = window.getSelection()
            if (!sel || sel.isCollapsed) {
                setSelection(null)
            }
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setSelection(null)
        }

        document.addEventListener('mousedown', handleClick)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handleClick)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    function handleCreateVocab() {
        if (!selection) return
        setDialogWord(selection.text)
        setDialogChunkId(selection.chunkId)
        setDialogContext(selection.chunkContent)
        setDialogOpen(true)
        setSelection(null)
        window.getSelection()?.removeAllRanges()
    }

    return (
        <div ref={containerRef} className="relative" onMouseUp={handleMouseUp}>
            {children}

            {/* Floating button */}
            {selection && (
                <div
                    data-vocab-popover
                    className="absolute z-50 -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-150"
                    style={{ left: selection.x, top: selection.y }}
                >
                    <Button
                        size="sm"
                        className="shadow-lg gap-1.5 rounded-full px-3"
                        onClick={handleCreateVocab}
                    >
                        <BookPlus className="h-3.5 w-3.5" />
                        Vokabel erstellen
                    </Button>
                </div>
            )}

            {/* Lookup dialog */}
            <VocabLookupDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                word={dialogWord}
                documentId={documentId}
                chunkId={dialogChunkId}
                chunkContext={dialogContext}
                defaultLanguage={defaultLanguage}
            />
        </div>
    )
}
