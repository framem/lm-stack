export const dynamic = 'force-dynamic'

import { Navigation } from '@/src/components/Navigation'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'
import { ModelsClient } from './ModelsClient'

export default async function ModelsPage() {
    const models = await getEmbeddingModels()

    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Embedding-Modelle</h1>
                    <p className="text-muted-foreground mt-1">
                        Modelle registrieren und verwalten
                    </p>
                </div>
                <ModelsClient initialModels={models} />
            </main>
        </div>
    )
}
