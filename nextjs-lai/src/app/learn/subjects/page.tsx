import Link from 'next/link'
import { FolderOpen, FileText, HelpCircle, Layers, Clock, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { getSubjectOverview } from '@/src/data-access/subjects'
import { getSubjects } from '@/src/data-access/documents'

export default async function SubjectsPage() {
    const [overview, subjects] = await Promise.all([
        getSubjectOverview(),
        getSubjects(),
    ])

    // Sort by most documents first, then alphabetically
    const sorted = overview.sort((a, b) =>
        b.documentCount - a.documentCount || a.subject.localeCompare(b.subject)
    )

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Fächer</h1>
                <p className="text-muted-foreground mt-1">
                    Deine Lernmaterialien nach Fächern organisiert
                </p>
            </div>

            {sorted.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <FolderOpen className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-semibold mb-2">Keine Fächer vorhanden</h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Weise deinen Dokumenten Fächer zu, um sie hier organisiert zu sehen.
                            Du kannst Fächer in der Dokumentenansicht festlegen.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sorted.map((item) => (
                        <Link
                            key={item.subject}
                            href={`/learn/subjects/${encodeURIComponent(item.subject)}`}
                        >
                            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <FolderOpen className="h-5 w-5 text-primary" />
                                            {item.subject}
                                        </CardTitle>
                                        {item.dueReviews > 0 && (
                                            <Badge variant="secondary" className="gap-1">
                                                <Clock className="h-3 w-3" />
                                                {item.dueReviews} fällig
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <FileText className="h-3.5 w-3.5" />
                                            {item.documentCount} Dokument{item.documentCount !== 1 ? 'e' : ''}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <HelpCircle className="h-3.5 w-3.5" />
                                            {item.quizCount} Quiz{item.quizCount !== 1 ? 'ze' : ''}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Layers className="h-3.5 w-3.5" />
                                            {item.flashcardCount}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Wissensstand</span>
                                            <span className="font-medium">{item.avgProgress}%</span>
                                        </div>
                                        <Progress value={item.avgProgress} className="h-2" />
                                    </div>

                                    <div className="flex items-center justify-end text-xs text-muted-foreground">
                                        <ArrowRight className="h-3 w-3" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
