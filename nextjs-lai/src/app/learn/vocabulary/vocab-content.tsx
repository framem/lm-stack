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
} from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { getVocabularyFlashcards, getDueVocabularyCount, getVocabularyLanguages } from '@/src/actions/flashcards'

interface VocabCard {
    id: string
    front: string
    back: string
    exampleSentence?: string | null
    partOfSpeech?: string | null
    document?: { id: string; title: string; subject?: string | null } | null
    progress?: {
        repetitions: number
        nextReviewAt: Date | null
    } | null
}

export function VocabContent() {
    const [cards, setCards] = useState<VocabCard[]>([])
    const [dueCount, setDueCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filterDoc, setFilterDoc] = useState<string | null>(null)
    const [filterLanguage, setFilterLanguage] = useState<string | null>(null)
    const [languages, setLanguages] = useState<string[]>([])

    useEffect(() => {
        async function load() {
            try {
                const [vocabCards, due, langs] = await Promise.all([
                    getVocabularyFlashcards(undefined, filterLanguage ?? undefined),
                    getDueVocabularyCount(),
                    getVocabularyLanguages(),
                ])
                setCards(vocabCards as unknown as VocabCard[])
                setDueCount(due)
                setLanguages(langs)
            } catch (err) {
                console.error('Failed to load vocabulary:', err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [filterLanguage])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Group cards by document
    const docGroups = new Map<string, { title: string; subject?: string | null; cards: VocabCard[] }>()
    for (const card of cards) {
        const docId = card.document?.id ?? 'unknown'
        if (!docGroups.has(docId)) {
            docGroups.set(docId, {
                title: card.document?.title ?? 'Unbekannt',
                subject: card.document?.subject,
                cards: [],
            })
        }
        docGroups.get(docId)!.cards.push(card)
    }

    const totalCards = cards.length
    const masteredCards = cards.filter((c) => c.progress && c.progress.repetitions >= 3).length

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
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
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{totalCards}</p>
                                    <p className="text-xs text-muted-foreground">Vokabeln gesamt</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex items-center gap-3 p-4">
                                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{dueCount}</p>
                                    <p className="text-xs text-muted-foreground">Fällige Vokabeln</p>
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
                        {dueCount > 0 && (
                            <Button asChild>
                                <Link href="/learn/vocabulary/study?mode=flip">
                                    <RotateCcw className="h-4 w-4" />
                                    Fällige lernen ({dueCount})
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

                    {/* Language filter pills */}
                    {languages.length > 1 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Sprache</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilterLanguage(null)}
                                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                        !filterLanguage ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                                    }`}
                                >
                                    Alle Sprachen
                                </button>
                                {languages.map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setFilterLanguage(lang)}
                                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                            filterLanguage === lang ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                                        }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filter pills */}
                    {docGroups.size > 1 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Vokabelset</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setFilterDoc(null)}
                                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                        !filterDoc ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                                    }`}
                                >
                                    Alle Sets
                                </button>
                                {[...docGroups.entries()].map(([docId, group]) => (
                                    <button
                                        key={docId}
                                        onClick={() => setFilterDoc(docId)}
                                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                            filterDoc === docId ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                                        }`}
                                    >
                                        {group.title} ({group.cards.length})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Card list grouped by document */}
                    <div className="space-y-6">
                        {[...docGroups.entries()]
                            .filter(([docId]) => !filterDoc || filterDoc === docId)
                            .map(([docId, group]) => (
                                <section key={docId} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{group.title}</h3>
                                        {group.subject && (
                                            <Badge variant="outline" className="gap-1">
                                                <FolderOpen className="h-3 w-3" />
                                                {group.subject}
                                            </Badge>
                                        )}
                                        <Badge variant="secondary">{group.cards.length} Vokabeln</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {group.cards.map((card) => {
                                            const isMastered = card.progress && card.progress.repetitions >= 3
                                            const isDue = !card.progress || (card.progress.nextReviewAt && new Date(card.progress.nextReviewAt) <= new Date())
                                            return (
                                                <Card key={card.id} className="relative">
                                                    <CardContent className="p-4 space-y-1">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-medium">{card.front}</p>
                                                            {card.partOfSpeech && (
                                                                <Badge variant="outline" className="text-xs shrink-0">
                                                                    {card.partOfSpeech}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{card.back}</p>
                                                        {card.exampleSentence && (
                                                            <p className="text-xs text-muted-foreground italic mt-1">
                                                                {card.exampleSentence}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-1.5 pt-1">
                                                            {isMastered ? (
                                                                <Badge variant="default" className="text-xs bg-green-600">Gelernt</Badge>
                                                            ) : isDue ? (
                                                                <Badge variant="secondary" className="text-xs">Fällig</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-xs">Geplant</Badge>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </section>
                            ))}
                    </div>
                </>
            )}
        </div>
    )
}
