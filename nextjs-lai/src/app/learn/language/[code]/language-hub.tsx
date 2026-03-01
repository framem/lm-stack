'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Clock,
    HelpCircle,
    Keyboard,
    Languages,
    Loader2,
    MessageSquare,
    Mic,
    RotateCcw,
    Sparkles,
    TrendingUp,
    Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { getVocabularyFlashcards } from '@/src/actions/flashcards'
import { getQuizzes } from '@/src/actions/quiz'
import { GamificationBar } from '@/src/components/GamificationBar'
import { languageSets } from '@/src/data/language-sets'
import { getLanguageFlag } from '@/src/lib/language-utils'

// Map language-set document titles to their static set IDs
const LANGUAGE_SET_ID_MAP: Record<string, string> = {
    'Spanisch A1 Grundwortschatz': 'es-a1',
    'Englisch A1 Grundwortschatz': 'en-a1',
    'Spanisch A2 Grundwortschatz': 'es-a2',
    'Englisch A2 Grundwortschatz': 'en-a2',
}

interface VocabCard {
    id: string
    front: string
    back: string
    document?: { id: string; title: string; subject?: string | null; fileType?: string | null } | null
    progress?: {
        reps: number
        due: Date | null
        repetitions: number
        nextReviewAt: Date | null
    } | null
}

interface QuizItem {
    id: string
    title: string
    createdAt: string | Date
    document?: { id: string; title: string } | null
    questions?: { id: string }[]
}

interface LanguageHubProps {
    code: string
    language: string
}

export function LanguageHub({ code, language }: LanguageHubProps) {
    const [cards, setCards] = useState<VocabCard[]>([])
    const [quizzes, setQuizzes] = useState<QuizItem[]>([])
    const [loading, setLoading] = useState(true)

    const flag = getLanguageFlag(code)

    useEffect(() => {
        async function load() {
            try {
                const [vocabCards, allQuizzes] = await Promise.all([
                    getVocabularyFlashcards(undefined, language),
                    getQuizzes(),
                ])
                setCards(vocabCards as unknown as VocabCard[])
                // Filter quizzes that belong to this language's documents
                const langQuizzes = (allQuizzes as unknown as QuizItem[]).filter((q) => {
                    const title = q.document?.title?.toLowerCase() ?? ''
                    return title.includes(language.toLowerCase())
                })
                setQuizzes(langQuizzes)
            } catch (err) {
                console.error('Failed to load language hub data:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [language])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Vocab stats
    const now = new Date()
    const totalCards = cards.length
    const masteredCards = cards.filter((c) => c.progress && (c.progress.reps ?? c.progress.repetitions) >= 3).length
    const trulyDueCount = cards.filter(c => c.progress?.due && new Date(c.progress.due) <= now).length
    const newCount = cards.filter(c => !c.progress).length
    const masteredPct = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0

    // Group cards by document for set tiles
    const docGroups = new Map<string, { title: string; fileType?: string | null; cards: VocabCard[] }>()
    for (const card of cards) {
        const docId = card.document?.id ?? 'unknown'
        if (!docGroups.has(docId)) {
            docGroups.set(docId, {
                title: card.document?.title ?? 'Unbekannt',
                fileType: card.document?.fileType,
                cards: [],
            })
        }
        docGroups.get(docId)!.cards.push(card)
    }

    // Filter language sets for this language
    const langSets = languageSets.filter((s) => s.subject === language)

    // Build set stats map
    const setIdToDocGroup = new Map<string, { docId: string; total: number; mastered: number; trulyDue: number; newCards: number }>()
    for (const [docId, group] of docGroups.entries()) {
        const setId = group.fileType === 'language-set' ? LANGUAGE_SET_ID_MAP[group.title] : undefined
        if (setId) {
            const total = group.cards.length
            const mastered = group.cards.filter(c => c.progress && (c.progress.reps ?? c.progress.repetitions) >= 3).length
            const tDue = group.cards.filter(c => c.progress?.due && new Date(c.progress.due) <= now).length
            const nCards = group.cards.filter(c => !c.progress).length
            setIdToDocGroup.set(setId, { docId, total, mastered, trulyDue: tDue, newCards: nCards })
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/learn/language">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <span className="text-4xl">{flag}</span>
                        {language}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Dein {language}-Lernbereich
                    </p>
                </div>
            </div>

            <GamificationBar />

            {/* Stats overview */}
            {totalCards > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalCards}</p>
                                <p className="text-xs text-muted-foreground">Vokabeln</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950">
                                <Sparkles className="h-4 w-4 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{newCount}</p>
                                <p className="text-xs text-muted-foreground">Neu</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
                                <Clock className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{trulyDueCount}</p>
                                <p className="text-xs text-muted-foreground">Fällig</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{masteredCards}</p>
                                <p className="text-xs text-muted-foreground">Beherrscht</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Progress bar */}
            {totalCards > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Gesamtfortschritt</span>
                        <span className="font-medium">{masteredPct}%</span>
                    </div>
                    <Progress value={masteredPct} className="h-2" />
                </div>
            )}

            {/* ── Vokabeln Section ── */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Vokabeln
                </h2>

                {/* Action buttons */}
                {totalCards > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {trulyDueCount > 0 && (
                            <Button asChild>
                                <Link href={`/learn/vocabulary/study?mode=flip&language=${code}`}>
                                    <RotateCcw className="h-4 w-4" />
                                    Fällige lernen ({trulyDueCount})
                                </Link>
                            </Button>
                        )}
                        {newCount > 0 && (
                            <Button variant={trulyDueCount === 0 ? 'default' : 'outline'} asChild>
                                <Link href={`/learn/vocabulary/study?mode=flip&new=true&language=${code}`}>
                                    <Sparkles className="h-4 w-4" />
                                    Neue lernen ({Math.min(newCount, 20)})
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href={`/learn/vocabulary/study?mode=flip&all=true&language=${code}`}>
                                <BookOpen className="h-4 w-4" />
                                Alle lernen
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/learn/vocabulary/study?mode=type&language=${code}`}>
                                <Keyboard className="h-4 w-4" />
                                Tipp-Modus
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={`/learn/vocabulary/study?mode=speech&language=${code}`}>
                                <Mic className="h-4 w-4" />
                                Sprech-Modus
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Language set tiles */}
                {langSets.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {langSets.map((set) => {
                            const stats = setIdToDocGroup.get(set.id)
                            const imported = !!stats
                            const setMasteredPct = stats && stats.total > 0
                                ? Math.round((stats.mastered / stats.total) * 100)
                                : 0

                            return (
                                <Card key={set.id} className={imported ? '' : 'opacity-60'}>
                                    <CardContent className="p-5 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{set.title}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{set.description}</p>
                                            </div>
                                            <Badge variant="outline" className="shrink-0">{set.level}</Badge>
                                        </div>

                                        {imported ? (
                                            <>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>Beherrscht</span>
                                                        <span>{setMasteredPct}%</span>
                                                    </div>
                                                    <Progress value={setMasteredPct} className="h-1.5" />
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span>{stats!.total} Vokabeln</span>
                                                    {stats!.trulyDue > 0 && (
                                                        <span className="text-orange-600 font-medium">• {stats!.trulyDue} fällig</span>
                                                    )}
                                                    {stats!.newCards > 0 && (
                                                        <span className="text-violet-600 font-medium">• {stats!.newCards} neu</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-end gap-2 pt-1">
                                                    <Button size="sm" asChild>
                                                        <Link href={`/learn/vocabulary/study?mode=flip&doc=${stats!.docId}`}>
                                                            Lernen
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/learn/vocabulary/sets/${set.id}`}>
                                                            Details →
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-end pt-1">
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href="/learn/admin">
                                                        Importieren
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {totalCards === 0 && langSets.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Languages className="h-8 w-8 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">
                                Noch keine {language}-Vokabeln vorhanden. Importiere ein Sprachset.
                            </p>
                            <Button asChild className="mt-3" size="sm">
                                <Link href="/learn/admin">Importieren</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* ── Quiz Section ── */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Quiz
                </h2>

                {quizzes.length > 0 ? (
                    <div className="space-y-3">
                        {quizzes.map((quiz) => (
                            <Card key={quiz.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-medium">{quiz.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {quiz.questions?.length ?? 0} Fragen
                                        </p>
                                    </div>
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={`/learn/quiz/${quiz.id}`}>
                                            Quiz starten
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <HelpCircle className="h-8 w-8 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">
                                Noch keine {language}-Quizze vorhanden.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </section>

            {/* ── Konversation Section ── */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Konversation
                </h2>
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-background">
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <h3 className="font-semibold">Konversation üben</h3>
                            <p className="text-sm text-muted-foreground">
                                Übe {language} in Alltagsszenarien mit KI
                            </p>
                        </div>
                        <Button asChild>
                            <Link href={`/learn/conversation?language=${code}`}>
                                <MessageSquare className="h-4 w-4" />
                                Starten
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>

            {/* ── Tagesübung Section ── */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Tagesübung
                </h2>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <h3 className="font-semibold">{language}-Tagesübung</h3>
                            <p className="text-sm text-muted-foreground">
                                {trulyDueCount > 0
                                    ? `${trulyDueCount} Vokabeln zur Wiederholung fällig`
                                    : 'Alles auf dem neuesten Stand!'
                                }
                            </p>
                        </div>
                        <Button variant={trulyDueCount > 0 ? 'default' : 'outline'} asChild>
                            <Link href={`/learn/vocabulary/study?mode=flip&language=${code}`}>
                                <Zap className="h-4 w-4" />
                                {trulyDueCount > 0 ? 'Jetzt üben' : 'Neue lernen'}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>

            {/* ── Fortschritt Section ── */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Fortschritt
                </h2>
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                                <p className="text-3xl font-bold">{totalCards}</p>
                                <p className="text-sm text-muted-foreground">Vokabeln gesamt</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-green-600">{masteredCards}</p>
                                <p className="text-sm text-muted-foreground">Beherrscht</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{masteredPct}%</p>
                                <p className="text-sm text-muted-foreground">Fortschritt</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href="/learn/progress">
                                    <TrendingUp className="h-4 w-4" />
                                    Detaillierten Fortschritt anzeigen
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    )
}
