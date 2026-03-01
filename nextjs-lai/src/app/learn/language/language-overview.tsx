import Link from 'next/link'
import { Languages, ArrowRight, Plus } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { getVocabularyLanguages } from '@/src/data-access/flashcards'
import { getCefrProgress } from '@/src/data-access/learning-goal'
import { resolveLanguageCode, getLanguageFlag } from '@/src/lib/language-utils'

const LEVEL_COLORS: Record<string, { ring: string; text: string }> = {
    A1: { ring: 'stroke-green-500', text: 'text-green-600 dark:text-green-400' },
    A2: { ring: 'stroke-blue-500', text: 'text-blue-600 dark:text-blue-400' },
    B1: { ring: 'stroke-purple-500', text: 'text-purple-600 dark:text-purple-400' },
    B2: { ring: 'stroke-amber-500', text: 'text-amber-600 dark:text-amber-400' },
}

function MiniProgressRing({ percentage, level }: { percentage: number; level: string }) {
    const size = 56
    const strokeWidth = 5
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference
    const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS.A1

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" strokeWidth={strokeWidth}
                    className="stroke-muted"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={`${colors.ring} transition-[stroke-dashoffset] duration-700 ease-out`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xs font-bold ${colors.text}`}>{percentage}%</span>
                <span className="text-[9px] font-semibold text-muted-foreground">{level}</span>
            </div>
        </div>
    )
}

export async function LanguageOverview() {
    const [languages, cefrProgress] = await Promise.all([
        getVocabularyLanguages(),
        getCefrProgress(),
    ])

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Languages className="h-8 w-8 text-primary" />
                        Sprachtrainer
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Alle deine Sprachen an einem Ort
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/learn/admin">
                        <Plus className="h-4 w-4" />
                        Sprache hinzufügen
                    </Link>
                </Button>
            </div>

            {languages.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <Languages className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-semibold mb-2">Noch keine Sprachen</h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Importiere ein Sprachset in den Admin-Einstellungen, um loszulegen.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/learn/admin">
                                Sprache importieren
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {languages.map((lang) => {
                        const code = resolveLanguageCode(lang)
                        const progress = cefrProgress.find((p) => p.language === code)
                        const flag = getLanguageFlag(lang)

                        return (
                            <Link key={lang} href={`/learn/language/${code ?? lang}`}>
                                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{flag}</span>
                                            <div className="flex-1">
                                                <h2 className="text-xl font-bold">{lang}</h2>
                                                {progress && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {progress.vocabMastered} / {progress.targetCount} Wörter
                                                    </p>
                                                )}
                                            </div>
                                            {progress && (
                                                <MiniProgressRing
                                                    percentage={progress.percentage}
                                                    level={progress.targetLevel}
                                                />
                                            )}
                                        </div>
                                        <div className="flex items-center text-sm text-primary">
                                            <span>Zum Sprachtrainer</span>
                                            <ArrowRight className="h-4 w-4 ml-1" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
