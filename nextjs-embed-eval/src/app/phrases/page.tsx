export const dynamic = 'force-dynamic'

import { Navigation } from '@/src/components/Navigation'
import { getTestPhrases } from '@/src/data-access/test-phrases'
import { getAllChunks } from '@/src/data-access/source-texts'
import { PhrasesClient } from './PhrasesClient'

export default async function PhrasesPage() {
    const [phrases, chunks] = await Promise.all([
        getTestPhrases(),
        getAllChunks(),
    ])

    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Testphrasen</h1>
                    <p className="text-muted-foreground mt-1">
                        Testphrasen definieren und erwartete Chunks zuordnen
                    </p>
                </div>
                <PhrasesClient initialPhrases={phrases} chunks={chunks} />
            </main>
        </div>
    )
}
