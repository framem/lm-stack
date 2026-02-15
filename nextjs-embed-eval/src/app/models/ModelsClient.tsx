'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { addEmbeddingModel, removeEmbeddingModel } from '@/src/actions/models'
import { toast } from 'sonner'
import { Trash2, Plus, Brain } from 'lucide-react'

interface EmbeddingModel {
    id: string
    name: string
    provider: string
    providerUrl: string
    dimensions: number
    description: string | null
    createdAt: Date
    _count: { chunkEmbeddings: number; evalRuns: number }
}

interface ModelsClientProps {
    initialModels: EmbeddingModel[]
}

export function ModelsClient({ initialModels }: ModelsClientProps) {
    const [showForm, setShowForm] = useState(false)
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result = await addEmbeddingModel(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Modell registriert')
                setShowForm(false)
            }
        })
    }

    async function handleDelete(id: string) {
        startTransition(async () => {
            await removeEmbeddingModel(id)
            toast.success('Modell gelöscht')
        })
    }

    return (
        <div className="space-y-6">
            <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'}>
                <Plus className="h-4 w-4 mr-2" />
                {showForm ? 'Abbrechen' : 'Neues Modell registrieren'}
            </Button>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Embedding-Modell registrieren</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Modellname</label>
                                <Input
                                    name="name"
                                    placeholder="z.B. nomic-embed-text-v1.5"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Provider</label>
                                    <Select name="provider" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Provider wählen..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lmstudio">LM Studio</SelectItem>
                                            <SelectItem value="ollama">Ollama</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Dimensionen</label>
                                    <Input
                                        name="dimensions"
                                        type="number"
                                        placeholder="z.B. 768"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Provider URL</label>
                                <Input
                                    name="providerUrl"
                                    placeholder="http://localhost:1234/v1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Beschreibung (optional)</label>
                                <Textarea
                                    name="description"
                                    placeholder="Kurze Beschreibung des Modells..."
                                    rows={2}
                                />
                            </div>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Wird gespeichert...' : 'Modell registrieren'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialModels.map(model => (
                    <Card key={model.id}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold">{model.name}</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(model.id)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <Badge variant="secondary">{model.provider}</Badge>
                                <Badge variant="outline">{model.dimensions}d</Badge>
                            </div>
                            {model.description && (
                                <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                            )}
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>{model._count.chunkEmbeddings} Chunk-Embeddings</p>
                                <p>{model._count.evalRuns} Eval-Runs</p>
                                <p className="truncate">{model.providerUrl}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {initialModels.length === 0 && (
                    <p className="text-center text-muted-foreground py-12 col-span-full">
                        Noch keine Modelle registriert. Registriere ein Embedding-Modell, um zu beginnen.
                    </p>
                )}
            </div>
        </div>
    )
}
