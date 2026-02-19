'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Layers, HelpCircle, BookOpen, BarChart2, Search, Loader2 } from 'lucide-react'
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from '@/src/components/ui/command'
import { Button } from '@/src/components/ui/button'

interface SearchResults {
    documents: { id: string; title: string; fileName: string | null; subject: string | null }[]
    flashcards: { id: string; front: string; back: string; document: { id: string; title: string } }[]
    quizzes: { id: string; title: string; document: { id: string; title: string } | null; _count: { questions: number } }[]
}

const STATIC_PAGES = [
    { label: 'Lernmaterial', href: '/learn/documents', icon: BookOpen },
    { label: 'Karteikarten', href: '/learn/flashcards', icon: Layers },
    { label: 'Quiz', href: '/learn/quiz', icon: HelpCircle },
    { label: 'Vokabeltrainer', href: '/learn/vocabulary', icon: FileText },
    { label: 'Fortschritt', href: '/learn/progress', icon: BarChart2 },
]

export function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResults>({ documents: [], flashcards: [], quizzes: [] })
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((prev) => !prev)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Debounced search fetch
    const fetchResults = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (q.length < 2) {
            setResults({ documents: [], flashcards: [], quizzes: [] })
            setLoading(false)
            return
        }
        setLoading(true)
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
                const data = await res.json()
                setResults(data)
            } catch {
                // silently ignore search errors
            } finally {
                setLoading(false)
            }
        }, 300)
    }, [])

    const handleQueryChange = (value: string) => {
        setQuery(value)
        fetchResults(value)
    }

    const navigate = (href: string) => {
        setOpen(false)
        setQuery('')
        setResults({ documents: [], flashcards: [], quizzes: [] })
        router.push(href)
    }

    const hasResults =
        results.documents.length > 0 ||
        results.flashcards.length > 0 ||
        results.quizzes.length > 0

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className="ml-auto gap-2 text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Search className="size-4" />
                <span className="hidden sm:inline text-sm">Suchen</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            <CommandDialog
                open={open}
                onOpenChange={(v) => {
                    setOpen(v)
                    if (!v) {
                        setQuery('')
                        setResults({ documents: [], flashcards: [], quizzes: [] })
                    }
                }}
                title="Globale Suche"
                description="Dokumente, Karteikarten und Quizze durchsuchen"
                showCloseButton={false}
            >
                <CommandInput
                    placeholder="Suchen…"
                    value={query}
                    onValueChange={handleQueryChange}
                />
                <CommandList>
                    {loading && (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!loading && query.length < 2 && (
                        <CommandGroup heading="Seiten">
                            {STATIC_PAGES.map((page) => (
                                <CommandItem
                                    key={page.href}
                                    value={page.label}
                                    onSelect={() => navigate(page.href)}
                                >
                                    <page.icon className="size-4" />
                                    {page.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {!loading && query.length >= 2 && !hasResults && (
                        <CommandEmpty>Keine Ergebnisse für „{query}"</CommandEmpty>
                    )}

                    {!loading && results.documents.length > 0 && (
                        <>
                            <CommandGroup heading="Dokumente">
                                {results.documents.map((doc) => (
                                    <CommandItem
                                        key={doc.id}
                                        value={`doc-${doc.id}-${doc.title}`}
                                        onSelect={() => navigate(`/learn/documents?search=${encodeURIComponent(doc.title)}`)}
                                    >
                                        <FileText className="size-4" />
                                        <span className="flex-1 truncate">{doc.title}</span>
                                        {doc.subject && (
                                            <span className="text-xs text-muted-foreground">{doc.subject}</span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandSeparator />
                        </>
                    )}

                    {!loading && results.flashcards.length > 0 && (
                        <>
                            <CommandGroup heading="Karteikarten">
                                {results.flashcards.map((card) => (
                                    <CommandItem
                                        key={card.id}
                                        value={`card-${card.id}-${card.front}`}
                                        onSelect={() => navigate('/learn/flashcards')}
                                    >
                                        <Layers className="size-4" />
                                        <span className="flex-1 truncate">
                                            {card.front} <span className="text-muted-foreground">→</span> {card.back}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandSeparator />
                        </>
                    )}

                    {!loading && results.quizzes.length > 0 && (
                        <CommandGroup heading="Quizze">
                            {results.quizzes.map((quiz) => (
                                <CommandItem
                                    key={quiz.id}
                                    value={`quiz-${quiz.id}-${quiz.title}`}
                                    onSelect={() => navigate('/learn/quiz')}
                                >
                                    <HelpCircle className="size-4" />
                                    <span className="flex-1 truncate">{quiz.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {quiz._count.questions} Fragen
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
