import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { resolveLanguage } from '@/src/lib/language-utils'
import { ConversationPageClient } from './conversation-page-client'
import { getUserBestEvaluations } from '@/src/actions/conversation-evaluation'
import { listGeneratedScenarios } from '@/src/actions/generated-scenarios'

interface ConversationPageProps {
    params: Promise<{ code: string }>
}

export default async function ConversationPage({ params }: ConversationPageProps) {
    const { code } = await params
    const lang = resolveLanguage(code)

    if (!lang) notFound()

    const [bestEvaluations, generatedScenarios] = await Promise.all([
        getUserBestEvaluations(),
        listGeneratedScenarios(),
    ])

    return (
        <Suspense fallback={<div className="p-6">Laden...</div>}>
            <ConversationPageClient
                language={code as 'de' | 'en' | 'es'}
                bestEvaluations={bestEvaluations}
                generatedScenarios={generatedScenarios}
            />
        </Suspense>
    )
}
