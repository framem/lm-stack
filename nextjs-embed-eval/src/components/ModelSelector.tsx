'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'

interface Model {
    id: string
    name: string
    provider: string
    dimensions: number
}

interface ModelSelectorProps {
    models: Model[]
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
}

export function ModelSelector({ models, value, onValueChange, placeholder = 'Modell wählen...' }: ModelSelectorProps) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {models.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                        <span className="font-medium">{model.name}</span>
                        <span className="ml-2 text-muted-foreground text-xs">
                            ({model.provider}, {model.dimensions}d)
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
