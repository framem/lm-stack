'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Languages,
    Loader2,
    BookOpen,
    Clock,
    CheckCircle2,
    Keyboard,
    RotateCcw,
    FolderOpen,
    Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { getVocabularyFlashcards } from '@/src/actions/flashcards'
import { languageSets } from '@/src/data/language-sets'
import { TTSButton } from '@/src/components/TTSButton'

// Map language subject to BCP-47 language code for TTS
const SUBJECT_LANG_MAP: Record<string, string> = {
    'Englisch': 'en-US',
    'Spanisch': 'es-ES',
    'Französisch': 'fr-FR',
    'Italienisch': 'it-IT',
    'Portugiesisch': 'pt-PT',
}

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
    exampleSentence?: string | null
    partOfSpeech?: string | null
    document?: { id: string; title: string; subject?: string | null; fileType?: string | null } | null
    progress?: {
        repetitions: number
        nextReviewAt: Date | null
    } | null
}

export function VocabContent() {
    const [cards, setCards] = useState<VocabCard[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const vocabCards = await getVocabularyFlashcards()
                setCards(vocabCards as unknown as VocabCard[])
            } catch (err) {
                console.error('Failed to load vocabulary:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Group cards by document
    const docGroups = new Map<string, { title: string; subject?: string | null; fileType?: string | null; cards: VocabCard[] }>()
    for (const card of cards) {
        const docId = card.document?.id ?? 'unknown'
        if (!docGroups.has(docId)) {
            docGroups.set(docId, {
                title: card.document?.title ?? 'Unbekannt',
                subject: card.document?.subject,
                fileType: card.document?.fileType,
                cards: [],
            })
        }
        docGroups.get(docId)!.cards.push(card)
    }

    const totalCards = cards.length
    const masteredCards = cards.filter((c) => c.progress && c.progress.repetitions >= 3).length

    // New cards = never studied; truly-due = reviewed before but past review date
    const now = new Date()
    const NEW_BATCH_SIZE = 20
    const trulyDueCount = cards.filter(c => c.progress?.nextReviewAt && new Date(c.progress.nextReviewAt) <= now).length
    const newCount = cards.filter(c => !c.progress).length
    const newBatchCount = Math.min(newCount, NEW_BATCH_SIZE)

    // Build a map from setId → per-doc stats for imported sets
    const setIdToDocGroup = new Map<string, { docId: string; total: number; mastered: number; trulyDue: number; newCards: number }>()
    for (const [docId, group] of docGroups.entries()) {
        const setId = group.fileType === 'language-set' ? LANGUAGE_SET_ID_MAP[group.title] : undefined
        if (setId) {
            const total = group.cards.length
            const mastered = group.cards.filter(c => c.progress && c.progress.repetitions >= 3).length
            const trulyDue = group.cards.filter(c => c.progress?.nextReviewAt && new Date(c.progress.nextReviewAt) <= now).length
            const newCards = group.cards.filter(c => !c.progress).length
            setIdToDocGroup.set(setId, { docId, total, mastered, trulyDue, newCards })
        }
    }

    // Group language sets by subject for section rendering
    const setsBySubject = new Map<string, typeof languageSets>()
    for (const set of languageSets) {
        if (!setsBySubject.has(set.subject)) {
            setsBySubject.set(set.subject, [])
        }
        setsBySubject.get(set.subject)!.push(set)
    }

    // Docs that are not recognized language sets go into "Sonstige"
    const otherDocs = [...docGroups.entries()].filter(
        ([, group]) => group.fileType !== 'language-set' || !LANGUAGE_SET_ID_MAP[group.title]
    )

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Languages className="h-8 w-8 text-primary" />
                    Vokabeltrainer
                </h1>
                <p className="text-muted-foreground mt-1">
                    Vokabeln gezielt lernen mit Tipp-Modus und Richtungswechsel
                </p>
            </div>

            {totalCards === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <Languages className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-semibold mb-2">Keine Vokabeln vorhanden</h2>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Lade ein Dokument mit Vokabeln hoch und generiere Karteikarten.
                            Vokabel-Dokumente werden automatisch erkannt.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/learn/documents">
                                Lernmaterial hochladen
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Global stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{totalCards}</p>
                                    <p className="text-xs text-muted-foreground">Gesamt</p>
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

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                        {trulyDueCount > 0 && (
                            <Button asChild>
                                <Link href="/learn/vocabulary/study?mode=flip">
                                    <RotateCcw className="h-4 w-4" />
                                    Fällige lernen ({trulyDueCount})
                                </Link>
                            </Button>
                        )}
                        {newCount > 0 && (
                            <Button variant={trulyDueCount === 0 ? 'default' : 'outline'} asChild>
                                <Link href="/learn/vocabulary/study?mode=flip&new=true">
                                    <Sparkles className="h-4 w-4" />
                                    Neue einführen ({newBatchCount} heute)
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href="/learn/vocabulary/study?mode=flip&all=true">
                                <BookOpen className="h-4 w-4" />
                                Alle lernen
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/learn/vocabulary/study?mode=type">
                                <Keyboard className="h-4 w-4" />
                                Tipp-Modus
                            </Link>
                        </Button>
                    </div>

                    {/* Language set tiles grouped by subject */}
                    {[...setsBySubject.entries()].map(([subject, sets]) => (
                        <section key={subject} className="space-y-4">
                            <h2 className="text-lg font-semibold">{subject}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sets.map((set) => {
                                    const stats = setIdToDocGroup.get(set.id)
                                    const imported = !!stats
                                    const masteredPct = stats && stats.total > 0
                                        ? Math.round((stats.mastered / stats.total) * 100)
                                        : 0

                                    return (
                                        <Card key={set.id} className={imported ? '' : 'opacity-60'}>
                                            <CardContent className="p-5 space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="font-semibold truncate">{set.title}</p>
                                                            <TTSButton
                                                                text={set.title}
                                                                lang={SUBJECT_LANG_MAP[set.subject] ?? 'de-DE'}
                                                                size="sm"
                                                                className="shrink-0"
                                                            />
                                                        </div>
                                                        <p className="text-sm text-muted-foreground line-clamp-1">{set.description}</p>
                                                    </div>
                                                    <Badge variant="outline" className="shrink-0">{set.level}</Badge>
                                                </div>

                                                {imported ? (
                                                    <>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                <span>Beherrscht</span>
                                                                <span>{masteredPct}%</span>
                                                            </div>
                                                            <Progress value={masteredPct} className="h-1.5" />
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
                                                                    Details anzeigen →
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
                        </section>
                    ))}

                    {/* Non-language-set documents */}
                    {otherDocs.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-lg font-semibold">Sonstige Vokabeln</h2>
                            <div className="flex flex-col gap-3">
                                {otherDocs.map(([docId, group]) => (
                                    <Card key={docId}>
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium">{group.title}</p>
                                                    <p className="text-xs text-muted-foreground">{group.cards.length} Vokabeln</p>
                                                </div>
                                            </div>
                                            <Button size="sm" asChild>
                                                <Link href={`/learn/vocabulary/study?mode=flip&doc=${docId}`}>
                                                    Lernen
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    )
}
