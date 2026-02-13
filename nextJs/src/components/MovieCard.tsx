'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/src/components/ui/badge'
import { useRef, useState, useEffect } from 'react'
import type { Movie } from '@/prisma/generated/prisma/client'
import { toMovieSlug, toGenreSlug } from '@/src/lib/slug'

export default function MovieCard({ movie }: { movie: Movie }) {
    const [isVisible, setIsVisible] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = cardRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { rootMargin: '200px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const posterSrc = movie.posterLink
        ? movie.posterLink.replace(/UX\d+_CR[\d,]+_AL_/, 'UX300_CR0,0,300,444_AL_')
        : null

    return (
        <div ref={cardRef} className="group relative">
            <Link href={`/movie/${toMovieSlug(movie.seriesTitle, movie.id)}`}>
                <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-zinc-800 transition-transform duration-300 group-hover:scale-105 group-hover:z-10 group-hover:shadow-xl group-hover:shadow-black/50">
                    {posterSrc && isVisible ? (
                        <Image
                            src={posterSrc}
                            alt={movie.seriesTitle}
                            fill
                            sizes="(max-width: 640px) 50vw, 160px"
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm text-center p-2">
                            {movie.seriesTitle}
                        </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <p className="text-white text-sm font-semibold leading-tight line-clamp-2">
                            {movie.seriesTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-300">
                            {movie.imdbRating && (
                                <span className="flex items-center gap-0.5">
                                    <span className="text-yellow-400">★</span>
                                    {movie.imdbRating}
                                </span>
                            )}
                            {movie.releasedYear && <span>{movie.releasedYear}</span>}
                        </div>
                        {movie.genre && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {movie.genre.split(',').slice(0, 2).map(g => (
                                    <Link
                                        key={g}
                                        href={`/genre/${toGenreSlug(g.trim())}`}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/10 border-0 text-zinc-300 hover:bg-white/20 transition-colors">
                                            {g.trim()}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    )
}
