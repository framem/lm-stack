export const dynamic = 'force-dynamic'

import { Navigation } from '@/src/components/Navigation'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'
import { getSourceTexts } from '@/src/data-access/source-texts'
import { GridSearchClient } from './GridSearchClient'

export default async function GridSearchPage() {
    const [models, sourceTexts] = await Promise.all([
        getEmbeddingModels(),
        getSourceTexts(),
    ])

    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Grid-Search</h1>
                    <p className="text-muted-foreground mt-1">
                        Automatisch verschiedene Chunk-Konfigurationen testen und die beste finden
                    </p>
                </div>
                <GridSearchClient
                    models={models}
                    sourceTexts={sourceTexts.map(st => ({ id: st.id, title: st.title }))}
                />
            </main>
        </div>
    )
}
