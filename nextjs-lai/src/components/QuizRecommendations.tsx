'use client'

import Link from 'next/link'
import { AlertTriangle, FileText, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'

interface WeakTopic {
    documentId: string
    documentTitle: string
    chunkIndex: number | null
    incorrectCount: number
}

interface QuizRecommendationsProps {
    weakTopics: WeakTopic[]
}

export function QuizRecommendations({ weakTopics }: QuizRecommendationsProps) {
    if (weakTopics.length === 0) return null

    return (
        <Card className="border-orange-500/30">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Schwache Bereiche
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    In diesen Bereichen hattest du Schwierigkeiten. Schau dir das Material nochmal an:
                </p>

                {weakTopics.map((topic, i) => (
                    <div
                        key={`${topic.documentId}-${topic.chunkIndex ?? i}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/50"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {topic.documentTitle}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {topic.chunkIndex !== null
                                        ? `Abschnitt ${topic.chunkIndex + 1} · `
                                        : ''}
                                    {topic.incorrectCount} {topic.incorrectCount === 1 ? 'Frage' : 'Fragen'} falsch
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/learn/documents/${topic.documentId}`}>
                                    <FileText className="h-3 w-3" />
                                    Öffnen
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                                <Link href={`/learn/documents/${topic.documentId}?tab=chat`}>
                                    <MessageSquare className="h-3 w-3" />
                                    Chat
                                </Link>
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
