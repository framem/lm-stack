import Link from 'next/link'
import { Sparkles, HelpCircle, Layers, Clock, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { getLearnerProfile } from '@/src/data-access/learning-paths'
import { generateLearningRecommendation } from '@/src/lib/learning-path-generator'

const actionConfig: Record<string, { label: string; icon: typeof HelpCircle; href: (docId: string) => string }> = {
    quiz: { label: 'Quizfragen wiederholen', icon: HelpCircle, href: (docId) => `/learn/quiz?documentId=${docId}` },
    flashcards: { label: 'Karteikarten lernen', icon: Layers, href: () => '/learn/flashcards/study' },
    review: { label: 'Wiederholung starten', icon: Clock, href: () => '/learn/session' },
    read: { label: 'Dokument lesen', icon: BookOpen, href: (docId) => `/learn/documents/${docId}` },
}

export async function NextStepWidget() {
    const profile = await getLearnerProfile()
    if (profile.documents.length === 0) return null

    const recommendation = await generateLearningRecommendation(profile)
    if (!recommendation) return null

    const action = actionConfig[recommendation.nextAction]
    if (!action) return null

    const doc = profile.documents.find((d) => d.documentId === recommendation.documentId)

    return (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-background">
            <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium">
                            Nächster Schritt: {doc?.documentTitle ?? 'Lernen'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {recommendation.reason}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {recommendation.estimatedMinutes > 0 && (
                        <Badge variant="secondary" className="text-xs hidden sm:flex">
                            ~{recommendation.estimatedMinutes} Min.
                        </Badge>
                    )}
                    <Button size="sm" asChild>
                        <Link href={action.href(recommendation.documentId)}>
                            <action.icon className="h-4 w-4" />
                            {action.label}
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
