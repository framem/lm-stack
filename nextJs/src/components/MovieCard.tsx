'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { useState, useRef, useEffect } from 'react'
import type { Movie } from '@/src/types/movie'

export default function MovieCard({ movie }: { movie: Movie }) {
    const [open, setOpen] = useState(false)
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

    const stars = [movie.star1, movie.star2, movie.star3, movie.star4].filter(Boolean)

    return (
        <>
            <div
                ref={cardRef}
                className="group relative flex-shrink-0 w-[160px] cursor-pointer"
                onClick={() => setOpen(true)}
            >
                <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-zinc-800 transition-transform duration-300 group-hover:scale-105 group-hover:z-10 group-hover:shadow-xl group-hover:shadow-black/50">
                    {posterSrc && isVisible ? (
                        <Image
                            src={posterSrc}
                            alt={movie.seriesTitle}
                            fill
                            sizes="160px"
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
                                    <Badge key={g} variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/10 border-0 text-zinc-300">
                                        {g.trim()}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-700 text-white sm:max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-white">{movie.seriesTitle}</DialogTitle>
                        <DialogDescription asChild>
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                {movie.imdbRating && (
                                    <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                                        ★ {movie.imdbRating}
                                    </span>
                                )}
                                {movie.metaScore && (
                                    <span className="bg-green-600 text-white px-1.5 py-0.5 text-xs font-bold rounded">
                                        {movie.metaScore}
                                    </span>
                                )}
                                {movie.releasedYear && <span>{movie.releasedYear}</span>}
                                {movie.runtime && <span>{movie.runtime}</span>}
                                {movie.certificate && (
                                    <span className="border border-zinc-500 px-1.5 py-0.5 text-xs">
                                        {movie.certificate}
                                    </span>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-4 mt-2">
                        {posterSrc && (
                            <div className="relative w-[120px] aspect-[2/3] flex-shrink-0 rounded overflow-hidden">
                                <Image
                                    src={posterSrc}
                                    alt={movie.seriesTitle}
                                    fill
                                    sizes="120px"
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1 space-y-3">
                            {movie.overview && (
                                <p className="text-zinc-300 text-sm leading-relaxed">
                                    {movie.overview}
                                </p>
                            )}
                            {movie.genre && (
                                <div className="flex flex-wrap gap-1.5">
                                    {movie.genre.split(',').map(g => (
                                        <Badge key={g} variant="outline" className="text-xs text-zinc-300 border-zinc-600">
                                            {g.trim()}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                        {movie.director && (
                            <div>
                                <span className="text-zinc-500">Director: </span>
                                <span className="text-zinc-200">{movie.director}</span>
                            </div>
                        )}
                        {stars.length > 0 && (
                            <div>
                                <span className="text-zinc-500">Stars: </span>
                                <span className="text-zinc-200">{stars.join(', ')}</span>
                            </div>
                        )}
                        {movie.noOfVotes && (
                            <div>
                                <span className="text-zinc-500">Votes: </span>
                                <span className="text-zinc-200">{movie.noOfVotes.toLocaleString()}</span>
                            </div>
                        )}
                        {movie.gross && (
                            <div>
                                <span className="text-zinc-500">Gross: </span>
                                <span className="text-zinc-200">${movie.gross}</span>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
