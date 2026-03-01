import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getDailyPracticeItems } from '@/src/data-access/session'
import { getOrCreateUserStats } from '@/src/data-access/user-stats'
import { DailyContent } from './daily-content'

async function DailyData() {
    const [items, stats] = await Promise.all([
        getDailyPracticeItems('documents-only'),
        getOrCreateUserStats(),
    ])

    const serialized = items.map((item) => ({
        ...item,
        data: JSON.parse(JSON.stringify(item.data)),
    }))

    return (
        <DailyContent
            initialItems={serialized}
            initialStreak={stats.currentStreak ?? 0}
        />
    )
}

export default function DailyPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <DailyData />
        </Suspense>
    )
}
