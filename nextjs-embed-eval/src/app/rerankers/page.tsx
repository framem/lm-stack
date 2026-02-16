export const dynamic = 'force-dynamic'

import { Navigation } from '@/src/components/Navigation'
import { getRerankerModels } from '@/src/data-access/reranker-models'
import { RerankerClient } from './RerankerClient'

export default async function RerankerPage() {
    const models = await getRerankerModels()

    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Reranker-Modelle</h1>
                    <p className="text-muted-foreground mt-1">
                        Cross-Encoder Modelle für Reranking registrieren und verwalten
                    </p>
                </div>
                <RerankerClient initialModels={models} />
            </main>
        </div>
    )
}
