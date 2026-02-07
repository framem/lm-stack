import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { getFeaturedMovie } from '@/src/data-access/movies'

export default async function HeroSection() {
    const movie = await getFeaturedMovie()

    if (!movie) return null

    const posterSrc = movie.posterLink
        ? movie.posterLink.replace(/UX\d+_CR[\d,]+_AL_/, 'UX300_CR0,0,300,444_AL_')
        : null

    return (
        <section className="relative w-full h-[60vh] min-h-[400px] flex items-end mb-8 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/80 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-[#141414]/40 z-10" />

            {/* Poster as background */}
            {posterSrc && (
                <div className="absolute right-0 top-0 h-full w-1/2 opacity-40">
                    <Image
                        src={posterSrc}
                        alt={movie.seriesTitle}
                        fill
                        className="object-cover object-top"
                        priority
                    />
                </div>
            )}

            {/* Content */}
            <div className="relative z-20 px-12 pb-12 max-w-2xl">
                <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">
                    {movie.seriesTitle}
                </h1>
                <div className="flex items-center gap-4 mb-4 text-sm text-zinc-300">
                    {movie.imdbRating && (
                        <span className="flex items-center gap-1 text-yellow-400 font-semibold text-base">
                            ★ {movie.imdbRating}
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
                {movie.overview && (
                    <p className="text-zinc-300 text-base leading-relaxed line-clamp-3 mb-4">
                        {movie.overview}
                    </p>
                )}
                {movie.genre && (
                    <div className="flex flex-wrap gap-2">
                        {movie.genre.split(',').map(g => (
                            <Badge key={g} variant="secondary" className="bg-white/10 border-0 text-zinc-300">
                                {g.trim()}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
