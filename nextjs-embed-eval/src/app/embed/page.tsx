export const dynamic = 'force-dynamic'

import { Navigation } from '@/src/components/Navigation'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'
import { getChunkEmbeddingCount, getPhraseEmbeddingCount } from '@/src/data-access/embeddings'
import { EmbedClient } from './EmbedClient'

export default async function EmbedPage() {
    const models = await getEmbeddingModels()

    // Get embedding counts per model
    const modelsWithCounts = await Promise.all(
        models.map(async (model) => ({
            ...model,
            chunkEmbeddingCount: await getChunkEmbeddingCount(model.id),
            phraseEmbeddingCount: await getPhraseEmbeddingCount(model.id),
        }))
    )

    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Embedding</h1>
                    <p className="text-muted-foreground mt-1">
                        Chunks und Testphrasen mit einem Modell einbetten
                    </p>
                </div>
                <EmbedClient models={modelsWithCounts} />
            </main>
        </div>
    )
}
