import { Suspense } from 'react'
import { getAllGenres, getTopRatedMovies } from '@/src/data-access/movies'
import HeroSection from '@/src/components/HeroSection'
import GenreRow from '@/src/components/GenreRow'
import GenreRowScroller from '@/src/components/GenreRowScroller'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

function RowSkeleton() {
    return (
        <div className="mb-8">
            <Skeleton className="h-6 w-32 mb-2 mx-12 bg-zinc-800" />
            <div className="flex gap-2 px-12">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="flex-shrink-0 w-[160px] aspect-[2/3] rounded-md bg-zinc-800" />
                ))}
            </div>
        </div>
    )
}

export default async function Home() {
    const [genres, topRated] = await Promise.all([
        getAllGenres(),
        getTopRatedMovies(20),
    ])

    return (
        <main className="pb-16">
            <HeroSection />

            {/* Top Rated row */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2 px-12 text-white">
                    Top Rated
                </h2>
                <GenreRowScroller movies={topRated} />
            </section>

            {/* Genre rows */}
            {genres.map(genre => (
                <Suspense key={genre} fallback={<RowSkeleton />}>
                    <GenreRow genre={genre} />
                </Suspense>
            ))}
        </main>
    )
}
