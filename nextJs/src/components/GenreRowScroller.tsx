'use client'

import { useRef, useState, useEffect } from 'react'
import MovieCard from './MovieCard'
import type { Movie } from '@/prisma/generated/prisma/client'

export default function GenreRowScroller({ movies }: { movies: Movie[] }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    const updateScrollButtons = () => {
        const el = scrollRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 0)
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10)
    }

    useEffect(() => {
        updateScrollButtons()
    }, [])

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current
        if (!el) return
        const scrollAmount = el.clientWidth * 0.8
        el.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        })
    }

    return (
        <div className="group/row relative">
            {/* Left arrow */}
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-0 bottom-0 z-20 w-10 bg-black/60 hover:bg-black/80 text-white text-2xl opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                    ‹
                </button>
            )}

            {/* Scrollable container */}
            <div
                ref={scrollRef}
                onScroll={updateScrollButtons}
                className="flex gap-2 overflow-x-auto scrollbar-hide px-12 py-2"
            >
                {movies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>

            {/* Right arrow */}
            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-0 bottom-0 z-20 w-10 bg-black/60 hover:bg-black/80 text-white text-2xl opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                    ›
                </button>
            )}
        </div>
    )
}
