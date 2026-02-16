'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { addRerankerModel, removeRerankerModel } from '@/src/actions/rerankers'
import { toast } from 'sonner'
import { Trash2, Plus, Shuffle } from 'lucide-react'

interface RerankerModel {
    id: string
    name: string
    provider: string
    providerUrl: string
    createdAt: Date
}

interface RerankerClientProps {
    initialModels: RerankerModel[]
}

export function RerankerClient({ initialModels }: RerankerClientProps) {
    const [showForm, setShowForm] = useState(false)
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result = await addRerankerModel(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Reranker-Modell registriert')
                setShowForm(false)
            }
        })
    }

    async function handleDelete(id: string) {
        startTransition(async () => {
            await removeRerankerModel(id)
            toast.success('Reranker-Modell gelöscht')
        })
    }

    return (
        <div className="space-y-6">
            <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'default'}>
                <Plus className="h-4 w-4 mr-2" />
                {showForm ? 'Abbrechen' : 'Neues Reranker-Modell registrieren'}
            </Button>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Reranker-Modell registrieren</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Modellname</label>
                                <Input
                                    name="name"
                                    placeholder="z.B. BAAI/bge-reranker-v2-m3"
                                    required
                                />
                            </div>
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
                                <label className="text-sm font-medium mb-1.5 block">Provider URL</label>
                                <Input
                                    name="providerUrl"
                                    placeholder="http://localhost:1234/v1"
                                    required
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
                                    <Shuffle className="h-5 w-5 text-primary" />
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
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <p className="truncate">{model.providerUrl}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {initialModels.length === 0 && (
                    <p className="text-center text-muted-foreground py-12 col-span-full">
                        Noch keine Reranker-Modelle registriert. Registriere ein Modell, um Reranking bei der Evaluation zu nutzen.
                    </p>
                )}
            </div>
        </div>
    )
}
