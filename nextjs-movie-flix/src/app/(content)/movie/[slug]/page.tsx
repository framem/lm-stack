import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/src/components/ui/badge'
import { getMovieById, getRecommendedMovies } from '@/src/data-access/movies'
import { extractIdFromSlug, toGenreSlug } from '@/src/lib/slug'
import { transformPosterUrl } from '@/src/lib/utils'
import GenreRowScroller from '@/src/components/GenreRowScroller'

export default async function MovieDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const id = extractIdFromSlug(slug)

    const [movie, recommendations] = await Promise.all([
        getMovieById(id),
        getRecommendedMovies(id),
    ])

    if (!movie) notFound()

    const posterSrc = transformPosterUrl(movie.posterLink)

    const stars = [movie.star1, movie.star2, movie.star3, movie.star4].filter(Boolean)

    return (
        <div className="min-h-screen bg-[#141414]">
            {/* Hero / Banner */}
            <section className="relative w-full min-h-[50vh] flex items-end overflow-hidden">
                {/* Blurred poster background */}
                {posterSrc && (
                    <div className="absolute inset-0">
                        <Image
                            src={posterSrc}
                            alt=""
                            fill
                            className="object-cover blur-sm scale-105 opacity-30"
                            priority
                        />
                    </div>
                )}

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/40 to-transparent" />

                {/* Hero content */}
                <div className="relative z-20 px-8 md:px-12 pb-10 pt-24 max-w-4xl">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                        {movie.seriesTitle}
                    </h1>

                    {/* Metadata row */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300 mb-4">
                        {movie.releasedYear && <span>{movie.releasedYear}</span>}
                        {movie.runtime && (
                            <>
                                <span className="text-zinc-600">|</span>
                                <span>{movie.runtime}</span>
                            </>
                        )}
                        {movie.certificate && (
                            <>
                                <span className="text-zinc-600">|</span>
                                <span className="border border-zinc-500 px-1.5 py-0.5 text-xs">
                                    {movie.certificate}
                                </span>
                            </>
                        )}
                        {movie.imdbRating && (
                            <>
                                <span className="text-zinc-600">|</span>
                                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                                    ★ {movie.imdbRating}
                                </span>
                            </>
                        )}
                        {movie.metaScore && (
                            <>
                                <span className="text-zinc-600">|</span>
                                <span className="bg-green-600 text-white px-1.5 py-0.5 text-xs font-bold rounded">
                                    {movie.metaScore}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Genre badges */}
                    {movie.genre && (
                        <div className="flex flex-wrap gap-2">
                            {movie.genre.split(',').map(g => (
                                <Link key={g} href={`/genre/${toGenreSlug(g.trim())}`}>
                                    <Badge variant="secondary" className="bg-white/10 border-0 text-zinc-300 hover:bg-white/20 transition-colors cursor-pointer">
                                        {g.trim()}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Content section */}
            <section className="px-8 md:px-12 py-10">
                <div className="flex flex-col md:flex-row gap-10 max-w-6xl">
                    {/* Left column */}
                    <div className="md:w-2/3 space-y-6">
                        {movie.overview && (
                            <p className="text-zinc-300 text-base leading-relaxed">
                                {movie.overview}
                            </p>
                        )}

                        <div className="space-y-3 text-sm">
                            {movie.director && (
                                <div>
                                    <span className="text-zinc-500">Director: </span>
                                    <span className="text-zinc-200">{movie.director}</span>
                                </div>
                            )}
                            {stars.length > 0 && (
                                <div>
                                    <span className="text-zinc-500">Cast: </span>
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
                    </div>

                    {/* Right column - Poster */}
                    <div className="md:w-1/3 flex justify-center md:justify-end">
                        {posterSrc && (
                            <div className="relative w-[260px] aspect-[2/3] rounded-lg overflow-hidden shadow-2xl shadow-black/50">
                                <Image
                                    src={posterSrc}
                                    alt={movie.seriesTitle}
                                    fill
                                    sizes="260px"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <section className="pb-16">
                    <h2 className="text-xl font-semibold mb-4 px-12 text-white">
                        Das könnte dir auch gefallen
                    </h2>
                    <GenreRowScroller movies={recommendations} />
                </section>
            )}
        </div>
    )
}
