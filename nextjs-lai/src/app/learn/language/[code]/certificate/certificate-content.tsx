'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Award,
    Download,
    Share2,
    Lock,
    FileText,
    CheckCircle2,
    Loader2,
    Printer,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { ProgressExport } from '@/src/components/ProgressExport'
import type { LanguageInfo } from '@/src/lib/language-utils'
import type { CertificateLevelStatus } from '@/src/actions/certificate'
import { getCertificateData } from '@/src/actions/certificate'

// ── Types ──────────────────────────────────────────────────────────────
interface CertificateContentProps {
    language: LanguageInfo
    levels: CertificateLevelStatus[]
    userStats: { totalXp: number; currentStreak: number; longestStreak: number }
    initialLevel?: string
}

// ── Helper: format date in German ──────────────────────────────────────
function formatDateDe(date: Date): string {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ── Main component ─────────────────────────────────────────────────────
export function CertificateContent({
    language,
    levels,
    userStats,
    initialLevel,
}: CertificateContentProps) {
    const [selectedLevel, setSelectedLevel] = useState<string | null>(initialLevel ?? null)
    const [userName, setUserName] = useState('')
    const [generating, setGenerating] = useState(false)
    const certRef = useRef<HTMLDivElement>(null)

    const selectedData = levels.find((l) => l.level.toLowerCase() === selectedLevel?.toLowerCase())

    // Print certificate via window.print()
    const handlePrint = useCallback(() => {
        window.print()
    }, [])

    // Download certificate as PDF via jsPDF
    const handleDownload = useCallback(async () => {
        if (!selectedLevel) return
        setGenerating(true)
        try {
            const data = await getCertificateData(
                language.code,
                language.name,
                selectedLevel.toLowerCase(),
            )
            if (!data) return
            const { generateCertificatePDF } = await import('@/src/lib/pdf-certificate')
            const doc = generateCertificatePDF(data, userName || 'Lernende/r')
            doc.save(`Zertifikat-${language.name}-${selectedLevel.toUpperCase()}.pdf`)
        } catch (err) {
            console.error('Download failed:', err)
        } finally {
            setGenerating(false)
        }
    }, [selectedLevel, language, userName])

    // Share certificate
    const handleShare = useCallback(async () => {
        if (!selectedLevel) return
        setGenerating(true)
        try {
            const data = await getCertificateData(
                language.code,
                language.name,
                selectedLevel.toLowerCase(),
            )
            if (!data) return
            const { generateCertificatePDF } = await import('@/src/lib/pdf-certificate')
            const doc = generateCertificatePDF(data, userName || 'Lernende/r')
            const blob = doc.output('blob')
            const file = new File(
                [blob],
                `Zertifikat-${language.name}-${selectedLevel.toUpperCase()}.pdf`,
                { type: 'application/pdf' },
            )

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: `${language.name} ${selectedLevel.toUpperCase()} Zertifikat`,
                    text: `Ich habe ${language.name} ${selectedLevel.toUpperCase()} abgeschlossen!`,
                    files: [file],
                })
            } else {
                // Fallback: copy a summary to clipboard
                await navigator.clipboard.writeText(
                    `Ich habe das Sprachniveau ${selectedLevel.toUpperCase()} in ${language.name} abgeschlossen! ${language.flag}`
                )
                alert('Link in die Zwischenablage kopiert!')
            }
        } catch (err) {
            if ((err as Error)?.name !== 'AbortError') {
                console.error('Share failed:', err)
            }
        } finally {
            setGenerating(false)
        }
    }, [selectedLevel, language, userName])

    // ── Certificate grid view (no level selected) ──────────────────────
    if (!selectedLevel || !selectedData) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6 print:hidden">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/learn/language/${language.code}`}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-amber-600" />
                        <h1 className="text-xl font-bold">Zertifikate — {language.name}</h1>
                    </div>
                </div>

                {/* Name input */}
                <Card>
                    <CardContent className="p-4">
                        <label className="text-sm font-medium block mb-2">
                            Name für Zertifikate
                        </label>
                        <input
                            type="text"
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Dein Name..."
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Wird auf dem Zertifikat angezeigt
                        </p>
                    </CardContent>
                </Card>

                {/* Certificate cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {levels.map((lvl) => (
                        <Card
                            key={lvl.level}
                            className={`transition-all ${
                                lvl.available
                                    ? 'cursor-pointer hover:border-amber-400/50 hover:shadow-md'
                                    : 'opacity-50'
                            }`}
                            onClick={() => lvl.available && setSelectedLevel(lvl.level.toLowerCase())}
                        >
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl shrink-0 ${
                                        lvl.available
                                            ? 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950 dark:to-amber-900'
                                            : 'bg-muted'
                                    }`}>
                                        {lvl.available ? (
                                            <Award className="h-7 w-7 text-amber-600" />
                                        ) : (
                                            <Lock className="h-7 w-7 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xl">{language.flag}</span>
                                            <h3 className="font-bold text-lg">{language.name} {lvl.level}</h3>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{lvl.setTitle}</p>
                                    </div>
                                </div>

                                {lvl.imported ? (
                                    <>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Fortschritt</span>
                                                <span>{lvl.masteredPct}%</span>
                                            </div>
                                            <Progress value={lvl.masteredPct} className="h-2" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                {lvl.masteredCards}/{lvl.totalCards} Vokabeln beherrscht
                                            </span>
                                            {lvl.available ? (
                                                <Badge className="bg-amber-600 text-xs">
                                                    Zertifikat verfügbar
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    <Lock className="h-3 w-3 mr-0.5" />
                                                    Gesperrt
                                                </Badge>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Sprachset noch nicht importiert
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Progress export section */}
                <ProgressExport
                    languageCode={language.code}
                    language={language.name}
                    flag={language.flag}
                />
            </div>
        )
    }

    // ── Certificate detail view (level selected) ───────────────────────
    return (
        <>
            {/* Screen-only controls */}
            <div className="p-6 max-w-4xl mx-auto space-y-6 print:hidden">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedLevel(null)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold">
                            {language.name} {selectedData.level} — Sprachzertifikat
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Zertifikat anzeigen, drucken oder herunterladen
                        </p>
                    </div>
                </div>

                {/* Name input for certificate */}
                <Card>
                    <CardContent className="p-4">
                        <label className="text-sm font-medium block mb-2">
                            Name auf dem Zertifikat
                        </label>
                        <input
                            type="text"
                            className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Dein Name..."
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                    <Button onClick={handlePrint}>
                        <Printer className="h-4 w-4" />
                        Zertifikat drucken
                    </Button>
                    <Button variant="outline" onClick={handleDownload} disabled={generating}>
                        {generating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        Als PDF herunterladen
                    </Button>
                    <Button variant="outline" onClick={handleShare} disabled={generating}>
                        <Share2 className="h-4 w-4" />
                        Teilen
                    </Button>
                </div>
            </div>

            {/* Certificate (visible on screen and in print) */}
            <div className="flex justify-center px-4 pb-8">
                <div
                    ref={certRef}
                    className="certificate-printable w-full max-w-[800px] aspect-[297/210] border-4 border-double border-amber-600 rounded-lg bg-white dark:bg-white text-slate-900 relative overflow-hidden print:border-4 print:max-w-none print:w-full print:h-auto print:aspect-[297/210] print:rounded-none"
                >
                    {/* Decorative corner elements */}
                    <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-500" />
                    <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-500" />
                    <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-500" />
                    <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-500" />

                    <div className="flex flex-col items-center justify-center h-full p-8 md:p-12 text-center">
                        {/* Header band */}
                        <div className="bg-blue-600 text-white px-8 py-2 rounded-full text-xs tracking-widest uppercase font-medium mb-6">
                            Sprachzertifikat
                        </div>

                        {/* Flag and language */}
                        <div className="text-5xl mb-2">{language.flag}</div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                            Zertifikat
                        </h1>

                        {/* Subtitle */}
                        <p className="text-slate-500 text-sm mb-4">Hiermit wird bestätigt, dass</p>

                        {/* User name */}
                        <div className="mb-2">
                            <p className="text-2xl md:text-3xl font-bold text-blue-600">
                                {userName || 'Lernende/r'}
                            </p>
                            <div className="mt-1 h-0.5 bg-amber-400 mx-auto" style={{ width: '120%', maxWidth: '300px' }} />
                        </div>

                        {/* Achievement */}
                        <p className="text-slate-700 mt-3 text-sm md:text-base">
                            das Sprachniveau <strong>{selectedData.level}</strong> in <strong>{language.name}</strong> erfolgreich abgeschlossen hat.
                        </p>

                        {/* Stats row */}
                        <div className="flex gap-4 md:gap-8 mt-6 mb-4">
                            <div className="text-center">
                                <p className="text-lg md:text-xl font-bold text-blue-600">
                                    {selectedData.masteredCards}/{selectedData.totalCards}
                                </p>
                                <p className="text-[10px] md:text-xs text-slate-500">Vokabeln beherrscht</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg md:text-xl font-bold text-blue-600">
                                    {selectedData.masteredPct}%
                                </p>
                                <p className="text-[10px] md:text-xs text-slate-500">Fortschritt</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg md:text-xl font-bold text-blue-600">
                                    {userStats.totalXp.toLocaleString('de-DE')}
                                </p>
                                <p className="text-[10px] md:text-xs text-slate-500">Gesamte XP</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg md:text-xl font-bold text-blue-600">
                                    {userStats.longestStreak}
                                </p>
                                <p className="text-[10px] md:text-xs text-slate-500">Tage Streak</p>
                            </div>
                        </div>

                        {/* Date */}
                        <p className="text-xs text-slate-400 mt-2">
                            Ausgestellt am {formatDateDe(new Date())}
                        </p>

                        {/* Footer */}
                        <div className="mt-4 bg-slate-100 rounded px-6 py-1.5 text-[10px] text-slate-400">
                            {selectedData.setTitle} — Lernplattform
                        </div>
                    </div>
                </div>
            </div>

            {/* Print-only styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .certificate-printable,
                    .certificate-printable * {
                        visibility: visible !important;
                    }
                    .certificate-printable {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 100vw;
                        height: 100vh;
                        margin: 0;
                        padding: 0;
                        border-radius: 0;
                        background: white !important;
                        color: black !important;
                    }
                    @page {
                        size: landscape;
                        margin: 0;
                    }
                }
            `}</style>
        </>
    )
}
