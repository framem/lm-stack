export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
    ArrowLeft,
    BookOpen,
    Clock,
    CheckCircle2,
    Keyboard,
    RotateCcw,
    AlertCircle,
    Info,
    Lock,
    Sparkles,
    Mic,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { getLanguageSetDetail } from '@/src/data-access/language-sets'
import { getLanguageSet } from '@/src/data/language-sets'
import { TTSButton } from '@/src/components/TTSButton'

const SUBJECT_LANG_MAP: Record<string, string> = {
    'Englisch': 'en-US',
    'Spanisch': 'es-ES',
    'Französisch': 'fr-FR',
    'Italienisch': 'it-IT',
    'Portugiesisch': 'pt-PT',
}

interface Props {
    params: Promise<{ id: string }>
}

export default async function LanguageSetDetailPage({ params }: Props) {
    const { id } = await params

    // Validate the set id against static metadata first
    const staticSet = getLanguageSet(id)
    if (!staticSet) notFound()

    const detail = await getLanguageSetDetail(id)
    if (!detail) notFound()

    const { set, imported, documentId, categories, totalCards, newCards, learningCards, masteredCards, dueCards } = detail

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/learn/vocabulary">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-bold">{set.title}</h1>
                        <Badge variant="outline" className="text-base px-3 py-0.5">{set.level}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 max-w-2xl">{set.description}</p>
                </div>
            </div>

            {/* Not-imported banner */}
            {!imported && (
                <Card className="border-muted-foreground/30 bg-muted/30">
                    <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                            <span className="font-medium">Dieses Set wurde noch nicht importiert</span>
                        </div>
                        <Button asChild size="sm">
                            <Link href="/learn/admin">
                                Zum Import
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {imported && (
                <>
                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt</CardTitle>
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalCards}</div>
                                <p className="text-xs text-muted-foreground">Vokabeln</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Neu</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-muted-foreground">{newCards}</div>
                                <p className="text-xs text-muted-foreground">Noch nicht gelernt</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">In Arbeit</CardTitle>
                                <Clock className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{learningCards}</div>
                                <p className="text-xs text-muted-foreground">1–2 Wiederholungen</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Beherrscht</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{masteredCards}</div>
                                <p className="text-xs text-muted-foreground">≥ 3 Wiederholungen</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Due banner */}
                    {dueCards > 0 && (
                        <Card className="border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-background">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-orange-500" />
                                    <span className="font-medium">
                                        {dueCards} Vokabel{dueCards !== 1 ? 'n' : ''} fällig
                                    </span>
                                </div>
                                <Button size="sm" asChild>
                                    <Link href={`/learn/vocabulary/study?mode=flip&doc=${documentId}`}>
                                        <RotateCcw className="h-4 w-4" />
                                        Lernen
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                        <Button asChild>
                            <Link href={`/learn/vocabulary/study?mode=flip&all=true&doc=${documentId}`}>
                                <BookOpen className="h-4 w-4" />
                                Alle lernen
                            </Link>
                        </Button>
                        {dueCards > 0 && (
                            <Button variant="outline" asChild>
                                <Link href={`/learn/vocabulary/study?mode=flip&doc=${documentId}`}>
                                    <RotateCcw className="h-4 w-4" />
                                    Fällige lernen ({dueCards})
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href={`/learn/vocabulary/study?mode=type&doc=${documentId}`}>
                                <Keyboard className="h-4 w-4" />
                                Tipp-Modus
                            </Link>
                        </Button>
                    </div>

                    {/* Knowledge distribution bar */}
                    {totalCards > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="text-sm font-semibold mb-4">Kenntnisstand</h3>
                                <div className="space-y-1 mb-3">
                                    <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                                        {newCards > 0 && (
                                            <div
                                                className="bg-muted-foreground/30 transition-all"
                                                style={{ width: `${(newCards / totalCards) * 100}%` }}
                                                title={`Neu: ${newCards}`}
                                            />
                                        )}
                                        {learningCards > 0 && (
                                            <div
                                                className="bg-yellow-400 transition-all"
                                                style={{ width: `${(learningCards / totalCards) * 100}%` }}
                                                title={`In Arbeit: ${learningCards}`}
                                            />
                                        )}
                                        {masteredCards > 0 && (
                                            <div
                                                className="bg-green-500 transition-all"
                                                style={{ width: `${(masteredCards / totalCards) * 100}%` }}
                                                title={`Beherrscht: ${masteredCards}`}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-6 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />
                                        Neu {Math.round((newCards / totalCards) * 100)}%
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-yellow-400" />
                                        In Arbeit {Math.round((learningCards / totalCards) * 100)}%
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500" />
                                        Beherrscht {Math.round((masteredCards / totalCards) * 100)}%
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Lesson timeline */}
                    <section className="space-y-6">
                        <h2 className="text-lg font-semibold">
                            Lektionen
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({categories.length})
                            </span>
                        </h2>
                        <div className="space-y-4">
                            {categories.map((cat) => {
                                const isCompleted = cat.completedPct >= 80
                                const isActive = cat.unlocked && !isCompleted
                                const categoryParam = encodeURIComponent(cat.name)

                                return (
                                    <Card
                                        key={cat.name}
                                        className={!cat.unlocked ? 'opacity-50' : ''}
                                    >
                                        <CardContent className="p-5 space-y-4">
                                            {/* Lesson header */}
                                            <div className="flex items-center gap-3">
                                                <div className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 text-sm font-bold ${
                                                    isCompleted
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                                                        : isActive
                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                                                            : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    ) : !cat.unlocked ? (
                                                        <Lock className="h-3.5 w-3.5" />
                                                    ) : (
                                                        cat.lessonIndex + 1
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold">Lektion {cat.lessonIndex + 1}: {cat.name}</h3>
                                                        {isCompleted && (
                                                            <Badge variant="default" className="bg-green-600 text-xs">Abgeschlossen</Badge>
                                                        )}
                                                        {isActive && (
                                                            <Badge variant="default" className="bg-blue-600 text-xs">Aktiv</Badge>
                                                        )}
                                                        {!cat.unlocked && (
                                                            <Badge variant="secondary" className="text-xs">Gesperrt</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {cat.total} Vokabeln · {cat.masteredCount} beherrscht
                                                        {cat.dueCount > 0 && ` · ${cat.dueCount} fällig`}
                                                        {cat.newCount > 0 && ` · ${cat.newCount} neu`}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary" className="shrink-0">
                                                    {cat.completedPct}%
                                                </Badge>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="space-y-1">
                                                <Progress value={cat.completedPct} className="h-2" />
                                                {!cat.unlocked && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Schließe Lektion {cat.lessonIndex} ab, um diese Lektion freizuschalten.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action buttons for unlocked lessons */}
                                            {cat.unlocked && (
                                                <div className="flex flex-wrap gap-2">
                                                    {cat.newCount > 0 && (
                                                        <Button size="sm" asChild>
                                                            <Link href={`/learn/vocabulary/study?mode=flip&doc=${documentId}&category=${categoryParam}&new=true`}>
                                                                <Sparkles className="h-3.5 w-3.5" />
                                                                Neue lernen ({cat.newCount})
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    {cat.dueCount > 0 && (
                                                        <Button size="sm" variant={cat.newCount === 0 ? 'default' : 'outline'} asChild>
                                                            <Link href={`/learn/vocabulary/study?mode=flip&doc=${documentId}&category=${categoryParam}`}>
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                                Fällige wiederholen ({cat.dueCount})
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/learn/vocabulary/study?mode=type&doc=${documentId}&category=${categoryParam}`}>
                                                            <Keyboard className="h-3.5 w-3.5" />
                                                            Tipp-Modus
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/learn/vocabulary/study?mode=speech&doc=${documentId}&category=${categoryParam}`}>
                                                            <Mic className="h-3.5 w-3.5" />
                                                            Sprech-Modus
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Expandable vocab list for unlocked lessons */}
                                            {cat.unlocked && (
                                                <details className="group">
                                                    <summary className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                                                        <Info className="h-3 w-3" />
                                                        Vokabeln anzeigen
                                                    </summary>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                                                        {cat.cards.map((card) => {
                                                            const reps = card.progress?.reps ?? card.progress?.repetitions ?? 0
                                                            const isMastered = reps >= 3
                                                            const isLearning = reps >= 1 && reps < 3
                                                            return (
                                                                <div
                                                                    key={card.id}
                                                                    className="flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                                                                >
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-1">
                                                                            <p className="font-medium truncate">{card.front}</p>
                                                                            <TTSButton
                                                                                text={card.front}
                                                                                lang={SUBJECT_LANG_MAP[set.subject] ?? 'de-DE'}
                                                                                size="sm"
                                                                                className="shrink-0 -my-1"
                                                                            />
                                                                        </div>
                                                                        <p className="text-muted-foreground truncate">{card.back}</p>
                                                                        {card.exampleSentence && (
                                                                            <div className="flex items-start gap-1 mt-1.5">
                                                                                <p className="text-xs text-muted-foreground italic leading-snug">{card.exampleSentence}</p>
                                                                                <TTSButton
                                                                                    text={card.exampleSentence}
                                                                                    lang={SUBJECT_LANG_MAP[set.subject] ?? 'de-DE'}
                                                                                    size="sm"
                                                                                    className="shrink-0 -mt-0.5"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                                        {card.partOfSpeech && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {card.partOfSpeech}
                                                                            </Badge>
                                                                        )}
                                                                        {isMastered ? (
                                                                            <Badge variant="default" className="text-xs bg-green-600">
                                                                                ✓
                                                                            </Badge>
                                                                        ) : isLearning ? (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                {reps}/3
                                                                            </Badge>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </details>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}
