import { getMoviesByGenre } from '@/src/data-access/movies'
import GenreRowScroller from './GenreRowScroller'

export default async function GenreRow({ genre }: { genre: string }) {
    const movies = await getMoviesByGenre(genre, 20)

    if (movies.length === 0) return null

    return (
        <section className="mb-8">
            <h2 className="text-xl font-semibold mb-2 px-12 text-white">
                {genre}
            </h2>
            <GenreRowScroller movies={movies} />
        </section>
    )
}
