export const dynamic = 'force-dynamic'

import { Navigation } from '@/src/components/Navigation'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'
import { getChunkEmbeddingCount, getPhraseEmbeddingCount, getTotalChunkCount, getTotalPhraseCount } from '@/src/data-access/embeddings'
import { EmbedClient } from './EmbedClient'

export default async function EmbedPage() {
    const [models, totalChunkCount, totalPhraseCount] = await Promise.all([
        getEmbeddingModels(),
        getTotalChunkCount(),
        getTotalPhraseCount(),
    ])

    // Get embedding counts per model
    const modelsWithCounts = await Promise.all(
        models.map(async (model) => {
            const [chunkEmbeddingCount, phraseEmbeddingCount] = await Promise.all([
                getChunkEmbeddingCount(model.id),
                getPhraseEmbeddingCount(model.id),
            ])
            return { ...model, chunkEmbeddingCount, phraseEmbeddingCount }
        })
    )

    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Embedding</h1>
                    <p className="text-muted-foreground mt-1">
                        Chunks und Suchphrasen mit einem Modell einbetten
                    </p>
                </div>
                <EmbedClient models={modelsWithCounts} totalChunkCount={totalChunkCount} totalPhraseCount={totalPhraseCount} />
            </main>
        </div>
    )
}
