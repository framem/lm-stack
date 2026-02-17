import { Skeleton } from '@/src/components/ui/skeleton'

export function DocumentsLoading() {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                ))}
            </div>
        </div>
    )
}
