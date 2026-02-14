'use client'

import Link from 'next/link'
import { HelpCircle, Trash2 } from 'lucide-react'
import { formatDate } from '@/src/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Button } from '@/src/components/ui/button'

interface QuizCardProps {
    id: string
    title: string
    documentId: string
    documentTitle: string
    questionCount: number
    createdAt: string
    lastAttemptAt?: string
    lastAttemptPercent?: number
    onDelete?: (id: string) => void
}

export function QuizCard({ id, title, documentId, documentTitle, questionCount, createdAt, lastAttemptAt, lastAttemptPercent, onDelete }: QuizCardProps) {
    const formattedDate = formatDate(createdAt)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2 min-w-0">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                    <CardTitle className="text-lg truncate">{title}</CardTitle>
                </div>
                <CardDescription className="truncate">
                    <Link href={`/documents/${documentId}`} className="hover:underline">
                        {documentTitle}
                    </Link>
                </CardDescription>
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
            <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                        {questionCount} {questionCount === 1 ? 'Frage' : 'Fragen'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formattedDate}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {lastAttemptAt != null && lastAttemptPercent != null
                        ? `Letzter Versuch: ${formatDate(lastAttemptAt)} — ${lastAttemptPercent} %`
                        : 'Noch kein Versuch'}
                </p>
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
