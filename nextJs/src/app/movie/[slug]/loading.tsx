import { Skeleton } from '@/components/ui/skeleton'

export default function MovieDetailLoading() {
    return (
        <div className="min-h-screen bg-[#141414]">
            {/* Hero skeleton */}
            <section className="relative w-full min-h-[50vh] flex items-end overflow-hidden">
                <Skeleton className="absolute inset-0 bg-zinc-800" />
                <div className="relative z-20 px-8 md:px-12 pb-10 pt-24 max-w-4xl w-full">
                    <Skeleton className="h-12 w-96 max-w-full mb-4 bg-zinc-700" />
                    <div className="flex gap-3 mb-4">
                        <Skeleton className="h-5 w-16 bg-zinc-700" />
                        <Skeleton className="h-5 w-20 bg-zinc-700" />
                        <Skeleton className="h-5 w-12 bg-zinc-700" />
                        <Skeleton className="h-5 w-16 bg-zinc-700" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full bg-zinc-700" />
                        <Skeleton className="h-6 w-20 rounded-full bg-zinc-700" />
                        <Skeleton className="h-6 w-20 rounded-full bg-zinc-700" />
                    </div>
                </div>
            </section>

            {/* Content skeleton */}
            <section className="px-8 md:px-12 py-10">
                <div className="flex flex-col md:flex-row gap-10 max-w-6xl">
                    {/* Left column */}
                    <div className="md:w-2/3 space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full bg-zinc-800" />
                            <Skeleton className="h-4 w-full bg-zinc-800" />
                            <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-48 bg-zinc-800" />
                            <Skeleton className="h-4 w-64 bg-zinc-800" />
                            <Skeleton className="h-4 w-32 bg-zinc-800" />
                            <Skeleton className="h-4 w-40 bg-zinc-800" />
                        </div>
                    </div>

                    {/* Right column - Poster placeholder */}
                    <div className="md:w-1/3 flex justify-center md:justify-end">
                        <Skeleton className="w-[260px] aspect-[2/3] rounded-lg bg-zinc-800" />
                    </div>
                </div>
            </section>

            {/* Recommendations skeleton */}
            <section className="pb-16">
                <Skeleton className="h-6 w-64 mb-4 mx-12 bg-zinc-800" />
                <div className="flex gap-2 px-12">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="flex-shrink-0 w-[160px] aspect-[2/3] rounded-md bg-zinc-800" />
                    ))}
                </div>
            </section>
        </div>
    )
}
