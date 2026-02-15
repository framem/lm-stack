import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGenreBySlug, getMoviesByGenre } from '@/src/data-access/movies'
import MovieCard from '@/src/components/MovieCard'

export default async function GenrePage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const genre = await getGenreBySlug(slug)

    if (!genre) notFound()

    const movies = await getMoviesByGenre(genre, 100)

    return (
        <div className="min-h-screen bg-[#141414] pt-20 pb-16">
            <div className="px-8 md:px-12">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        Startseite
                    </Link>
                    <span className="text-zinc-600 mx-2">/</span>
                    <span className="text-sm text-zinc-300">{genre}</span>

                    <h1 className="text-3xl md:text-4xl font-bold text-white mt-3">
                        {genre} Filme
                    </h1>
                    <p className="text-zinc-400 mt-2">
                        {movies.length} {movies.length === 1 ? 'Film' : 'Filme'} gefunden
                    </p>
                </div>

                {/* Movie grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                    {movies.map(movie => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            </div>
        </div>
    )
}
