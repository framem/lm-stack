'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { ModelSelector } from '@/src/components/ModelSelector'
import { EmbedProgress } from '@/src/components/EmbedProgress'
import { useSSE } from '@/src/hooks/useSSE'
import { FlaskConical } from 'lucide-react'

interface Model {
    id: string
    name: string
    provider: string
    providerUrl: string
    dimensions: number
    chunkEmbeddingCount: number
    phraseEmbeddingCount: number
}

interface EmbedClientProps {
    models: Model[]
}

export function EmbedClient({ models }: EmbedClientProps) {
    const [selectedModelId, setSelectedModelId] = useState('')
    const sse = useSSE<{ chunksEmbedded: number; phrasesEmbedded: number }>()

    function startEmbedding() {
        if (!selectedModelId) return
        sse.start(`/api/embed?modelId=${selectedModelId}`)
    }

    const selectedModel = models.find(m => m.id === selectedModelId)

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5" />
                        Embedding starten
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Modell wählen</label>
                        <ModelSelector
                            models={models}
                            value={selectedModelId}
                            onValueChange={setSelectedModelId}
                        />
                    </div>

                    {selectedModel && (
                        <div className="flex gap-2 text-sm">
                            <Badge variant="outline">{selectedModel.dimensions}d</Badge>
                            <span className="text-muted-foreground">
                                {selectedModel.chunkEmbeddingCount} Chunk-Embeddings,{' '}
                                {selectedModel.phraseEmbeddingCount} Phrasen-Embeddings vorhanden
                            </span>
                        </div>
                    )}

                    <Button
                        onClick={startEmbedding}
                        disabled={!selectedModelId || sse.isRunning}
                    >
                        {sse.isRunning ? 'Läuft...' : 'Alle Chunks & Phrasen einbetten'}
                    </Button>

                    {sse.isRunning && (
                        <Button variant="outline" onClick={sse.abort}>
                            Abbrechen
                        </Button>
                    )}
                </CardContent>
            </Card>

            <EmbedProgress
                progress={sse.progress}
                isRunning={sse.isRunning}
                error={sse.error}
                result={sse.data}
            />

            {/* Model overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Modell-Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {models.map(model => (
                            <div key={model.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <span className="font-medium">{model.name}</span>
                                    <Badge variant="outline">{model.dimensions}d</Badge>
                                    <Badge variant="secondary">{model.provider}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {model.chunkEmbeddingCount} Chunks, {model.phraseEmbeddingCount} Phrasen
                                </div>
                            </div>
                        ))}
                        {models.length === 0 && (
                            <p className="text-muted-foreground">
                                Keine Modelle registriert. Gehe zu <strong>Modelle</strong>, um eines hinzuzufügen.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
