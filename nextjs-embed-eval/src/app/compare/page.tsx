export const dynamic = 'force-dynamic'

import { Navigation } from '@/src/components/Navigation'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'
import { CompareClient } from './CompareClient'

export default async function ComparePage() {
    const models = await getEmbeddingModels()

    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Modell-Vergleich</h1>
                    <p className="text-muted-foreground mt-1">
                        Embedding-Modelle anhand ihrer Evaluierungsmetriken vergleichen
                    </p>
                </div>
                <CompareClient models={models} />
            </main>
        </div>
    )
}
