import { Suspense } from 'react'
import { ConversationPageClient } from './conversation-page-client'
import { getUserBestEvaluations } from '@/src/actions/conversation-evaluation'

export default async function ConversationPage() {
    const bestEvaluations = await getUserBestEvaluations()

    return (
        <Suspense fallback={<div className="p-6">Laden...</div>}>
            <ConversationPageClient bestEvaluations={bestEvaluations} />
        </Suspense>
    )
}
