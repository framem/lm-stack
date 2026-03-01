import Link from 'next/link'
import { Languages, ArrowRight, Plus } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { getVocabularyLanguages } from '@/src/data-access/flashcards'
import { getCefrProgress } from '@/src/data-access/learning-goal'

const LANGUAGE_FLAGS: Record<string, string> = {
    'Spanisch': '🇪🇸',
    'Englisch': '🇬🇧',
    'Deutsch': '🇩🇪',
    'Französisch': '🇫🇷',
    'Italienisch': '🇮🇹',
}

export async function LanguageOverview() {
    const [languages, cefrProgress] = await Promise.all([
        getVocabularyLanguages(),
        getCefrProgress(),
    ])

    // Map CEFR progress by language code for lookup
    const LANGUAGE_TO_CODE: Record<string, string> = {
        'Spanisch': 'es',
        'Englisch': 'en',
        'Deutsch': 'de',
    }

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
                        const code = LANGUAGE_TO_CODE[lang]
                        const progress = cefrProgress.find((p) => p.language === code)
                        const flag = LANGUAGE_FLAGS[lang] ?? '🌐'

                        return (
                            <Link key={lang} href={`/learn/language/${encodeURIComponent(lang)}`}>
                                <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{flag}</span>
                                            <div>
                                                <h2 className="text-xl font-bold">{lang}</h2>
                                                {progress && (
                                                    <Badge variant="outline">{progress.targetLevel}</Badge>
                                                )}
                                            </div>
                                        </div>
                                        {progress && (
                                            <div className="text-sm text-muted-foreground">
                                                <p>{progress.vocabMastered} / {progress.targetCount} Wörter beherrscht</p>
                                                <p>{progress.percentage}% Fortschritt</p>
                                            </div>
                                        )}
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
