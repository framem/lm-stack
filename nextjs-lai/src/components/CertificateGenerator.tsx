'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
    Award,
    Download,
    FileText,
    Loader2,
    Share2,
    CheckCircle2,
    Lock,
    ExternalLink,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import {
    getCertificateData,
    getLanguageProgress,
} from '@/src/actions/certificate'

interface CertificateGeneratorProps {
    languageCode: string
    language: string
    flag: string
    levels: Array<{
        level: string
        masteredPct: number
        imported: boolean
    }>
}

export function CertificateGenerator({
    languageCode,
    language,
    flag,
    levels,
}: CertificateGeneratorProps) {
    const [generating, setGenerating] = useState<string | null>(null)

    // Download full progress export
    const downloadProgress = useCallback(async () => {
        setGenerating('progress')
        try {
            const data = await getLanguageProgress(languageCode, language, flag)
            const { generateProgressPDF } = await import('@/src/lib/pdf-certificate')
            const doc = generateProgressPDF(data, 'Lernende/r')
            doc.save(`Lernfortschritt-${language}.pdf`)
        } catch (err) {
            console.error('Progress export failed:', err)
        } finally {
            setGenerating(null)
        }
    }, [languageCode, language, flag])

    return (
        <div className="space-y-4">
            {/* Level certificates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {levels.map((lvl) => {
                    const available = lvl.imported && lvl.masteredPct > 0

                    return (
                        <Card key={lvl.level} className={!available ? 'opacity-60' : ''}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg shrink-0 ${
                                        available
                                            ? 'bg-amber-100 dark:bg-amber-950'
                                            : 'bg-muted'
                                    }`}>
                                        {available ? (
                                            <Award className="h-5 w-5 text-amber-600" />
                                        ) : (
                                            <Lock className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{language} {lvl.level.toUpperCase()}</p>
                                            {lvl.masteredPct >= 80 && (
                                                <Badge variant="default" className="bg-green-600 text-xs">
                                                    <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                                    Abgeschlossen
                                                </Badge>
                                            )}
                                        </div>
                                        {lvl.imported ? (
                                            <p className="text-xs text-muted-foreground">
                                                {lvl.masteredPct}% beherrscht
                                            </p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">Noch nicht importiert</p>
                                        )}
                                    </div>
                                </div>

                                {lvl.imported && (
                                    <Progress value={lvl.masteredPct} className="h-1.5" />
                                )}

                                {available && (
                                    <div className="flex items-center justify-end">
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={`/learn/language/${languageCode}/certificate?level=${lvl.level}`}>
                                                <Award className="h-3.5 w-3.5" />
                                                Zertifikat anzeigen
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Progress export */}
            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-semibold">Lernfortschritt exportieren</p>
                            <p className="text-xs text-muted-foreground">
                                Vollständige Übersicht als PDF herunterladen
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={downloadProgress}
                        disabled={generating === 'progress'}
                    >
                        {generating === 'progress' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        Exportieren
                    </Button>
                </CardContent>
            </Card>

            {/* Link to full certificate page */}
            <div className="text-center">
                <Button variant="link" asChild>
                    <Link href={`/learn/language/${languageCode}/certificate`}>
                        Alle Zertifikate anzeigen
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                </Button>
            </div>
        </div>
    )
}
