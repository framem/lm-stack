'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toMovieSlug } from '@/src/lib/slug'
import { type Movie } from '@/prisma/generated/prisma/client'

export default function SearchBar() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Movie[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const search = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([])
            setOpen(false)
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
            if (res.ok) {
                const data: Movie[] = await res.json()
                setResults(data)
                setOpen(true)
            }
        } finally {
            setLoading(false)
        }
    }, [])

    const handleChange = (value: string) => {
        setQuery(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => search(value), 300)
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEsc)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEsc)
        }
    }, [])

    return (
        <div ref={containerRef} className="relative w-80">
            <div className="flex items-center bg-zinc-800 rounded border border-zinc-600 focus-within:border-white transition-colors">
                <svg className="w-4 h-4 ml-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder="Titel oder Thema suchen..."
                    className="w-full bg-transparent text-sm text-white placeholder-zinc-400 px-3 py-2 outline-none"
                />
                {loading && (
                    <div className="mr-3 w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
            </div>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded shadow-2xl max-h-96 overflow-y-auto z-50">
                    {results.length === 0 ? (
                        <p className="text-zinc-400 text-sm p-4 text-center">Keine Ergebnisse</p>
                    ) : (
                        results.map((movie) => (
                            <Link
                                key={movie.id}
                                href={`/movie/${toMovieSlug(movie.seriesTitle, movie.id)}`}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors"
                            >
                                {movie.posterLink ? (
                                    <img
                                        src={movie.posterLink}
                                        alt={movie.seriesTitle}
                                        className="w-10 h-14 object-cover rounded shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-14 bg-zinc-700 rounded shrink-0 flex items-center justify-center text-zinc-500 text-xs">
                                        N/A
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{movie.seriesTitle}</p>
                                    <p className="text-zinc-400 text-xs">
                                        {[movie.releasedYear, movie.genre, movie.imdbRating && `★ ${movie.imdbRating}`]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
