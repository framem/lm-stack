import { Suspense } from 'react'
import { ConversationPageClient } from './conversation-page-client'
import { getUserBestEvaluations } from '@/src/actions/conversation-evaluation'
import { listGeneratedScenarios } from '@/src/actions/generated-scenarios'

export default async function ConversationPage() {
    const [bestEvaluations, generatedScenarios] = await Promise.all([
        getUserBestEvaluations(),
        listGeneratedScenarios(),
    ])

    return (
        <Suspense fallback={<div className="p-6">Laden...</div>}>
            <ConversationPageClient
                bestEvaluations={bestEvaluations}
                generatedScenarios={generatedScenarios}
            />
        </Suspense>
    )
}
