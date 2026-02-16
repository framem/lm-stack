export const dynamic = 'force-dynamic'

import { Navigation } from '@/src/components/Navigation'
import { getSourceTexts } from '@/src/data-access/source-texts'
import { TextsClient } from './TextsClient'

export default async function TextsPage() {
    const texts = await getSourceTexts()

    return (
        <div className="min-h-screen">
            <Navigation />
            <main className="mx-auto max-w-7xl px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Quelltexte</h1>
                    <p className="text-muted-foreground mt-1">
                        Texte hinzufügen, chunken und verwalten
                    </p>
                </div>
                <TextsClient initialTexts={texts} />
            </main>
        </div>
    )
}
