import Link from 'next/link'
import { getMoviesByGenre } from '@/src/data-access/movies'
import { toGenreSlug } from '@/src/lib/slug'
import GenreRowScroller from './GenreRowScroller'

export default async function GenreRow({ genre }: { genre: string }) {
    const movies = await getMoviesByGenre(genre, 20)

    if (movies.length === 0) return null

    return (
        <section className="mb-8">
            <Link
                href={`/genre/${toGenreSlug(genre)}`}
                className="group/title inline-flex items-center gap-2 px-12 mb-2"
            >
                <h2 className="text-xl font-semibold text-white group-hover/title:text-red-500 transition-colors">
                    {genre}
                </h2>
                <span className="text-sm text-zinc-500 opacity-0 group-hover/title:opacity-100 transition-opacity">
                    Alle anzeigen &rsaquo;
                </span>
            </Link>
            <GenreRowScroller movies={movies} />
        </section>
    )
}
