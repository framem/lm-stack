'use client'

import Link from 'next/link'
import { HelpCircle, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'

interface QuizCardProps {
    id: string
    title: string
    documentTitle: string
    questionCount: number
    createdAt: string
    onDelete?: (id: string) => void
}

export function QuizCard({ id, title, documentTitle, questionCount, createdAt, onDelete }: QuizCardProps) {
    const formattedDate = new Date(createdAt).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2 min-w-0">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                    <CardTitle className="text-lg truncate">{title}</CardTitle>
                </div>
                <CardDescription className="truncate">{documentTitle}</CardDescription>
                {onDelete && (
                    <CardAction>
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onDelete(id)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </CardAction>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                        {questionCount} {questionCount === 1 ? 'Frage' : 'Fragen'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formattedDate}</span>
                </div>
            </CardContent>
            <CardFooter className="gap-2">
                <Button asChild size="sm">
                    <Link href={`/quiz/${id}`}>Quiz starten</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/quiz/${id}/results`}>Ergebnisse</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
