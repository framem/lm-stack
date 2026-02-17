'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft, Languages, Trophy, Sparkles, Plus, Trash2 } from 'lucide-react'
import { SCENARIOS, LANGUAGE_LABELS, type ConversationScenario, type Language } from '@/src/lib/conversation-scenarios-constants'
import { ConversationContent } from './conversation-content'
import { ScenarioGenerator } from '@/src/components/ScenarioGenerator'
import { removeGeneratedScenario } from '@/src/actions/generated-scenarios'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'

// DB record shape from Prisma
interface GeneratedScenarioRecord {
    id: string
    key: string
    language: string
    difficulty: string
    icon: string
    title: string
    description: string
    systemPrompt: string
    suggestions: string[]
    createdAt: Date
    updatedAt: Date
    userId: string | null
}

interface ConversationPageClientProps {
    bestEvaluations: Record<string, {
        grammarScore: number
        vocabularyScore: number
        communicationScore: number
        createdAt: Date
    }>
    generatedScenarios: GeneratedScenarioRecord[]
}

// Convert a generated scenario DB record to the ConversationScenario shape
function toConversationScenario(record: GeneratedScenarioRecord): ConversationScenario {
    const translation = {
        title: record.title,
        description: record.description,
        systemPrompt: record.systemPrompt,
        suggestions: record.suggestions,
    }
    return {
        key: record.key,
        difficulty: record.difficulty,
        icon: record.icon,
        translations: { de: translation, en: translation, es: translation },
    }
}

export function ConversationPageClient({ bestEvaluations, generatedScenarios }: ConversationPageClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [activeScenario, setActiveScenario] = useState<ConversationScenario | null>(null)
    const [selectedLanguage, setSelectedLanguage] = useState<Language>('de')
    const [showGenerator, setShowGenerator] = useState(false)

    // Auto-select scenario and language from URL params
    useEffect(() => {
        const scenarioKey = searchParams.get('scenario')
        const languageParam = searchParams.get('language') as Language | null

        if (scenarioKey && languageParam) {
            // Set language first
            setSelectedLanguage(languageParam)

            // Find the scenario in standard scenarios
            const standardScenario = SCENARIOS.find((s) => s.key === scenarioKey)
            if (standardScenario) {
                setActiveScenario(standardScenario)
                return
            }

            // Find in generated scenarios
            const generatedScenario = generatedScenarios.find(
                (s) => s.key === scenarioKey && s.language === languageParam
            )
            if (generatedScenario) {
                setActiveScenario(toConversationScenario(generatedScenario))
            }
        }
    }, [searchParams, generatedScenarios])

    if (activeScenario) {
        const translation = activeScenario.translations[selectedLanguage]
        return (
            <div className="flex flex-col h-[calc(100vh-4rem)]">
                <div className="border-b border-border px-6 py-3 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setActiveScenario(null)
                            router.push('/learn/conversation')
                        }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Zurück
                    </Button>
                    <span className="text-lg">{activeScenario.icon}</span>
                    <h1 className="font-semibold">{translation.title}</h1>
                    <Badge variant="outline">{activeScenario.difficulty}</Badge>
                    <Badge variant="secondary" className="gap-1">
                        {LANGUAGE_LABELS[selectedLanguage].flag} {LANGUAGE_LABELS[selectedLanguage].nativeName}
                    </Badge>
                </div>
                <ConversationContent scenario={activeScenario} language={selectedLanguage} />
            </div>
        )
    }

    // Filter generated scenarios by selected language
    const filteredGenerated = generatedScenarios.filter(
        (s) => s.language === selectedLanguage
    )

    const handleDeleteGenerated = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        try {
            await removeGeneratedScenario(id)
            toast.success('Szenario gelöscht.')
            router.refresh()
        } catch {
            toast.error('Szenario konnte nicht gelöscht werden.')
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Konversationsübungen
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Übe Alltagssituationen in Rollenspielen mit KI-Gesprächspartnern.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setShowGenerator(!showGenerator)}
                    >
                        {showGenerator ? (
                            <>Schließen</>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                Szenario erstellen
                            </>
                        )}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Languages className="h-4 w-4" />
                                {LANGUAGE_LABELS[selectedLanguage].flag} {LANGUAGE_LABELS[selectedLanguage].name}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                                <DropdownMenuItem
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className="gap-2"
                                >
                                    {LANGUAGE_LABELS[lang].flag} {LANGUAGE_LABELS[lang].name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Scenario generator (toggle) */}
            {showGenerator && (
                <ScenarioGenerator
                    onScenarioGenerated={() => {
                        router.refresh()
                        setShowGenerator(false)
                    }}
                />
            )}

            {/* Standard scenarios */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold">Standard-Szenarien</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {SCENARIOS.map((scenario) => {
                        const germanTranslation = scenario.translations.de
                        const bestEval = bestEvaluations[scenario.key]
                        const hasAttempt = !!bestEval

                        let avgScore = 0
                        if (bestEval) {
                            avgScore = (bestEval.grammarScore + bestEval.vocabularyScore + bestEval.communicationScore) / 3
                        }

                        return (
                            <Card
                                key={scenario.key}
                                className="cursor-pointer transition-colors hover:bg-accent/30 relative flex flex-col"
                                onClick={() => setActiveScenario(scenario)}
                            >
                                <CardHeader className="pb-2 flex-1">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <span className="text-xl">{scenario.icon}</span>
                                        <span className="flex-1">{germanTranslation.title}</span>
                                        {hasAttempt && (
                                            <Badge variant="secondary" className="text-xs">
                                                Geübt
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription>{germanTranslation.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex gap-2 items-center mt-auto pt-0">
                                    <Badge variant="secondary">{scenario.difficulty}</Badge>
                                    <Badge variant="outline" className="gap-1">
                                        {LANGUAGE_LABELS[selectedLanguage].flag}
                                    </Badge>
                                    {hasAttempt && (
                                        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                            <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                                            <span className="font-medium">{avgScore.toFixed(1)}/10</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Generated scenarios */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Deine generierten Szenarien
                </h2>
                {filteredGenerated.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Noch keine generierten Szenarien für {LANGUAGE_LABELS[selectedLanguage].name}.
                        Erstelle dein erstes Szenario mit dem Button oben.
                    </p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredGenerated.map((record) => {
                            const bestEval = bestEvaluations[record.key]
                            const hasAttempt = !!bestEval

                            let avgScore = 0
                            if (bestEval) {
                                avgScore = (bestEval.grammarScore + bestEval.vocabularyScore + bestEval.communicationScore) / 3
                            }

                            return (
                                <Card
                                    key={record.id}
                                    className="cursor-pointer transition-colors hover:bg-accent/30 relative flex flex-col"
                                    onClick={() => setActiveScenario(toConversationScenario(record))}
                                >
                                    <CardHeader className="pb-2 flex-1">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="text-xl">{record.icon}</span>
                                            <span className="flex-1">{record.title}</span>
                                            {hasAttempt && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Geübt
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>{record.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex gap-2 items-center mt-auto pt-0">
                                        <Badge variant="secondary">{record.difficulty}</Badge>
                                        <Badge variant="outline" className="gap-1">
                                            {LANGUAGE_LABELS[record.language as Language]?.flag}
                                        </Badge>
                                        {hasAttempt && (
                                            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                                                <span className="font-medium">{avgScore.toFixed(1)}/10</span>
                                            </div>
                                        )}
                                    </CardContent>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute bottom-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => handleDeleteGenerated(e, record.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
