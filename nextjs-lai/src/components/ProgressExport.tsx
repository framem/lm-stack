'use client'

import { useState, useCallback } from 'react'
import {
    Download,
    FileText,
    Loader2,
    Printer,
    BookOpen,
    CheckCircle2,
    Flame,
    Zap,
    Clock,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Progress } from '@/src/components/ui/progress'
import { Badge } from '@/src/components/ui/badge'
import {
    getLanguageProgress,
    type LanguageProgressSummary,
} from '@/src/actions/certificate'

interface ProgressExportProps {
    languageCode: string
    language: string
    flag: string
}

export function ProgressExport({ languageCode, language, flag }: ProgressExportProps) {
    const [data, setData] = useState<LanguageProgressSummary | null>(null)
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    // Load progress data
    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const result = await getLanguageProgress(languageCode, language, flag)
            setData(result)
        } catch (err) {
            console.error('Failed to load progress:', err)
        } finally {
            setLoading(false)
        }
    }, [languageCode, language, flag])

    // Export as PDF via jsPDF
    const handleExportPDF = useCallback(async () => {
        setGenerating(true)
        try {
            const progressData = data ?? await getLanguageProgress(languageCode, language, flag)
            if (!data) setData(progressData)
            const { generateProgressPDF } = await import('@/src/lib/pdf-certificate')
            const doc = generateProgressPDF(progressData, 'Lernende/r')
            doc.save(`Lernfortschritt-${language}.pdf`)
        } catch (err) {
            console.error('Export failed:', err)
        } finally {
            setGenerating(false)
        }
    }, [data, languageCode, language, flag])

    // Print via window.print()
    const handlePrint = useCallback(() => {
        window.print()
    }, [])

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lernfortschritt exportieren
            </h2>

            {/* Load/show toggle */}
            {!data ? (
                <Card>
                    <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950">
                            <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-semibold">Fortschrittsbericht erstellen</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Erstelle eine vollständige Übersicht deines {language}-Lernfortschritts
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={loadData} disabled={loading}>
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FileText className="h-4 w-4" />
                                )}
                                Bericht anzeigen
                            </Button>
                            <Button variant="outline" onClick={handleExportPDF} disabled={generating}>
                                {generating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                Als PDF exportieren
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3 print:hidden">
                        <Button variant="outline" onClick={handleExportPDF} disabled={generating}>
                            {generating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Als PDF exportieren
                        </Button>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            Drucken
                        </Button>
                    </div>

                    {/* Printable progress report */}
                    <div className="progress-export-printable space-y-4">
                        {/* Overview stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <Card>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                                        <BookOpen className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{data.totalCards}</p>
                                        <p className="text-xs text-muted-foreground">Vokabeln gesamt</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{data.masteredCards}</p>
                                        <p className="text-xs text-muted-foreground">Beherrscht ({data.masteredPct}%)</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950">
                                        <Zap className="h-4 w-4 text-violet-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{data.totalXp.toLocaleString('de-DE')}</p>
                                        <p className="text-xs text-muted-foreground">Gesamte XP</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
                                        <Flame className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{data.currentStreak} / {data.longestStreak}</p>
                                        <p className="text-xs text-muted-foreground">Streak (aktuell / max)</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950">
                                        <Clock className="h-4 w-4 text-cyan-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{data.totalLearningMinutes} Min.</p>
                                        <p className="text-xs text-muted-foreground">Lernzeit gesamt</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950">
                                        <FileText className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{data.quizzesCompleted}</p>
                                        <p className="text-xs text-muted-foreground">Quizze absolviert</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Overall progress */}
                        <Card>
                            <CardContent className="p-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{data.flag} {data.language} Gesamtfortschritt</span>
                                    <span className="font-bold">{data.masteredPct}%</span>
                                </div>
                                <Progress value={data.masteredPct} className="h-3" />
                            </CardContent>
                        </Card>

                        {/* Level details */}
                        <h3 className="font-semibold">Stufen-Details</h3>
                        <div className="space-y-3">
                            {data.levels.map((lvl) => (
                                <Card key={lvl.level}>
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={lvl.completed ? 'default' : 'outline'}
                                                    className={lvl.completed ? 'bg-green-600' : ''}
                                                >
                                                    {lvl.level}
                                                </Badge>
                                                <span className="font-medium text-sm">{lvl.setTitle}</span>
                                            </div>
                                            {lvl.completed && (
                                                <Badge variant="default" className="bg-green-600 text-xs">
                                                    <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                                    Abgeschlossen
                                                </Badge>
                                            )}
                                        </div>
                                        <Progress value={lvl.masteredPct} className="h-2" />
                                        <p className="text-xs text-muted-foreground">
                                            {lvl.totalCards > 0
                                                ? `${lvl.masteredCards}/${lvl.totalCards} Vokabeln beherrscht (${lvl.masteredPct}%)`
                                                : 'Noch nicht importiert'
                                            }
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
