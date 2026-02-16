'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { SCENARIOS, type ConversationScenario } from '@/src/lib/conversation-scenarios'
import { ConversationContent } from './conversation-content'

export default function ConversationPage() {
    const [activeScenario, setActiveScenario] = useState<ConversationScenario | null>(null)

    if (activeScenario) {
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
                    <h1 className="font-semibold">{activeScenario.title}</h1>
                    <Badge variant="outline">{activeScenario.difficulty}</Badge>
                </div>
                <ConversationContent scenario={activeScenario} />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Konversationsübungen</h1>
                <p className="text-muted-foreground mt-1">
                    Übe Alltagssituationen auf Deutsch in Rollenspielen mit KI-Gesprächspartnern.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {SCENARIOS.map((scenario) => (
                    <Card
                        key={scenario.key}
                        className="cursor-pointer transition-colors hover:bg-accent/30"
                        onClick={() => setActiveScenario(scenario)}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <span className="text-xl">{scenario.icon}</span>
                                {scenario.title}
                            </CardTitle>
                            <CardDescription>{scenario.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="secondary">{scenario.difficulty}</Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
