import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getCombinedDueItems } from '@/src/data-access/session'
import { SessionContent } from './session-content'

async function SessionData() {
    const items = await getCombinedDueItems(30, 'documents-only')

    const serialized = items.map((item) => ({
        ...item,
        data: JSON.parse(JSON.stringify(item.data)),
    }))

    return <SessionContent initialItems={serialized} />
}

export default function SessionPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <SessionData />
        </Suspense>
    )
}
