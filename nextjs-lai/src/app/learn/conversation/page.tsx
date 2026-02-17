'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft, Languages } from 'lucide-react'
import { SCENARIOS, LANGUAGE_LABELS, type ConversationScenario, type Language } from '@/src/lib/conversation-scenarios'
import { ConversationContent } from './conversation-content'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'

export default function ConversationPage() {
    const [activeScenario, setActiveScenario] = useState<ConversationScenario | null>(null)
    const [selectedLanguage, setSelectedLanguage] = useState<Language>('de')

    if (activeScenario) {
        const translation = activeScenario.translations[selectedLanguage]
        return (
            <div className="flex flex-col h-[calc(100vh-4rem)]">
                <div className="border-b border-border px-6 py-3 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveScenario(null)}
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {SCENARIOS.map((scenario) => {
                    // Always use German for UI text (title and description stay in German)
                    // Only the conversation itself is in the selected language
                    const germanTranslation = scenario.translations.de
                    return (
                        <Card
                            key={scenario.key}
                            className="cursor-pointer transition-colors hover:bg-accent/30"
                            onClick={() => setActiveScenario(scenario)}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <span className="text-xl">{scenario.icon}</span>
                                    {germanTranslation.title}
                                </CardTitle>
                                <CardDescription>{germanTranslation.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex gap-2">
                                <Badge variant="secondary">{scenario.difficulty}</Badge>
                                <Badge variant="outline" className="gap-1">
                                    {LANGUAGE_LABELS[selectedLanguage].flag}
                                </Badge>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
