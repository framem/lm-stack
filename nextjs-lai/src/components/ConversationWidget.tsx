import Link from 'next/link'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { SCENARIOS, type Language } from '@/src/lib/conversation-scenarios-constants'

// Language-specific featured scenario keys
const FEATURED_KEYS: Record<Language, string[]> = {
    es: ['mercado', 'farmacia', 'estacion'],
    en: ['london_trip', 'cafe', 'supermarkt'],
    de: ['cafe', 'supermarkt', 'wegbeschreibung'],
}

interface ConversationWidgetProps {
    targetLanguage?: Language
}

export function ConversationWidget({ targetLanguage = 'es' }: ConversationWidgetProps) {
    const keys = FEATURED_KEYS[targetLanguage] ?? FEATURED_KEYS.de
    const featured = SCENARIOS.filter((s) => keys.includes(s.key))

    return (
        <Card>
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-950">
                            <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold">Konversation üben</h2>
                            <p className="text-sm text-muted-foreground">Rollenspielen mit KI-Gesprächspartnern</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/learn/conversation" className="gap-1 text-xs">
                            Alle anzeigen
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {featured.map((scenario) => (
                        <Link
                            key={scenario.key}
                            href={`/learn/conversation?scenario=${scenario.key}&language=${targetLanguage}`}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                            <span className="text-xl shrink-0">{scenario.icon}</span>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {scenario.translations.de.title}
                                </p>
                                <Badge variant="secondary" className="text-xs mt-0.5">
                                    {scenario.difficulty}
                                </Badge>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
