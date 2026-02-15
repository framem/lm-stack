export const dynamic = 'force-dynamic'

import { Navigation } from '@/src/components/Navigation'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'
import { getEvalRuns } from '@/src/data-access/evaluation'
import { EvaluateClient } from './EvaluateClient'

export default async function EvaluatePage() {
    const [models, evalRuns] = await Promise.all([
        getEmbeddingModels(),
        getEvalRuns(),
    ])

    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Auswertung</h1>
                    <p className="text-muted-foreground mt-1">
                        RAG-Evaluation starten und Ergebnisse ansehen
                    </p>
                </div>
                <EvaluateClient models={models} initialRuns={evalRuns} />
            </main>
        </div>
    )
}
