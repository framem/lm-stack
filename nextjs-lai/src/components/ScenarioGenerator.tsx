'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, RotateCcw } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Textarea } from '@/src/components/ui/textarea'
import { Spinner } from '@/src/components/ui/spinner'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/src/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { LANGUAGE_LABELS, type Language } from '@/src/lib/conversation-scenarios'

// CEFR difficulty levels
const DIFFICULTY_LEVELS = [
    { value: 'A1', label: 'A1 — Anfänger' },
    { value: 'A2', label: 'A2 — Grundlegende Kenntnisse' },
    { value: 'B1', label: 'B1 — Fortgeschrittene Sprachverwendung' },
    { value: 'B2', label: 'B2 — Selbständige Sprachverwendung' },
    { value: 'C1', label: 'C1 — Fachkundige Sprachkenntnisse' },
    { value: 'C2', label: 'C2 — Annähernd muttersprachlich' },
] as const

interface GeneratedScenarioResult {
    id: string
    key: string
    title: string
    description: string
    difficulty: string
    language: Language
    theme?: string
}

interface ScenarioGeneratorProps {
    onScenarioGenerated?: (scenario: GeneratedScenarioResult) => void
}

export function ScenarioGenerator({ onScenarioGenerated }: ScenarioGeneratorProps) {
    const [language, setLanguage] = useState<Language>('de')
    const [difficulty, setDifficulty] = useState<string>('A2')
    const [theme, setTheme] = useState('')
    const [customContext, setCustomContext] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedScenario, setGeneratedScenario] = useState<GeneratedScenarioResult | null>(null)

    const handleGenerate = async () => {
        setIsGenerating(true)
        setGeneratedScenario(null)

        try {
            const response = await fetch('/api/scenarios/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language,
                    difficulty,
                    theme: theme.trim() || undefined,
                    customContext: customContext.trim() || undefined,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                throw new Error(errorData?.error || 'Szenario konnte nicht generiert werden.')
            }

            const scenario: GeneratedScenarioResult = await response.json()
            setGeneratedScenario(scenario)
            toast.success('Szenario erfolgreich generiert!')
            onScenarioGenerated?.(scenario)
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Ein unerwarteter Fehler ist aufgetreten.'
            toast.error(message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleReset = () => {
        setTheme('')
        setCustomContext('')
        setGeneratedScenario(null)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Szenario generieren
                </CardTitle>
                <CardDescription>
                    Erstelle ein maßgeschneidertes Konversationsszenario mit KI-Unterstützung.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Language selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Sprache</label>
                    <Select
                        value={language}
                        onValueChange={(val) => setLanguage(val as Language)}
                        disabled={isGenerating}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sprache wählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                                <SelectItem key={lang} value={lang}>
                                    {LANGUAGE_LABELS[lang].flag} {LANGUAGE_LABELS[lang].name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Difficulty selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Schwierigkeitsgrad</label>
                    <Select
                        value={difficulty}
                        onValueChange={setDifficulty}
                        disabled={isGenerating}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Niveau wählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {DIFFICULTY_LEVELS.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Theme (optional) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Thema <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Input
                        placeholder="z.B. Einkaufen, Arztbesuch, Bewerbungsgespräch..."
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        disabled={isGenerating}
                    />
                </div>

                {/* Custom context (optional) */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Zusätzlicher Kontext <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Textarea
                        placeholder="Beschreibe die Situation genauer, z.B. besondere Vokabeln oder Grammatik, die geübt werden soll..."
                        value={customContext}
                        onChange={(e) => setCustomContext(e.target.value)}
                        disabled={isGenerating}
                        className="min-h-20"
                    />
                </div>

                {/* Generated scenario preview */}
                {generatedScenario && (
                    <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{generatedScenario.title}</h3>
                            <Badge variant="secondary">{generatedScenario.difficulty}</Badge>
                            <Badge variant="outline">
                                {LANGUAGE_LABELS[generatedScenario.language].flag}{' '}
                                {LANGUAGE_LABELS[generatedScenario.language].name}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {generatedScenario.description}
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="gap-2">
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="gap-2"
                >
                    {isGenerating ? (
                        <>
                            <Spinner />
                            Wird generiert...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            Szenario generieren
                        </>
                    )}
                </Button>
                {(theme || customContext || generatedScenario) && !isGenerating && (
                    <Button variant="outline" onClick={handleReset} className="gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Zurücksetzen
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
