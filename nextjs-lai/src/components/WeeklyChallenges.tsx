'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Target, CheckCircle2, MessageSquare, BookOpen, RotateCcw, Brain, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Progress } from '@/src/components/ui/progress'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/src/components/ui/collapsible'

interface Challenge {
    id: string
    label: string
    description: string
    icon: typeof Target
    current: number
    target: number
    href: string
    color: string
}

interface WeeklyChallengesProps {
    totalConversations: number
    totalFlashcards: number
    dueFlashcards: number
    dueVocab: number
    totalQuizzes: number
    targetLanguage?: 'en' | 'es'
}

// Get the Monday of the current ISO week
function getWeekKey(): string {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7 // Mon=1 ... Sun=7
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek + 1)
    return monday.toISOString().split('T')[0]
}

const STORAGE_KEY = 'lai-weekly-challenges'

interface WeeklyStorage {
    weekKey: string
    conversationsAtStart: number
    flashcardsAtStart: number
    quizzesAtStart: number
}

export function WeeklyChallenges({
    totalConversations,
    totalFlashcards,
    dueFlashcards,
    dueVocab,
    totalQuizzes,
    targetLanguage,
}: WeeklyChallengesProps) {
    const [open, setOpen] = useState(true)
    const [weekData, setWeekData] = useState<WeeklyStorage | null>(null)

    useEffect(() => {
        const weekKey = getWeekKey()
        const stored = localStorage.getItem(STORAGE_KEY)
        let data: WeeklyStorage

        if (stored) {
            try {
                data = JSON.parse(stored)
                if (data.weekKey !== weekKey) {
                    // New week — reset baselines
                    data = {
                        weekKey,
                        conversationsAtStart: totalConversations,
                        flashcardsAtStart: totalFlashcards,
                        quizzesAtStart: totalQuizzes,
                    }
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
                }
            } catch {
                data = {
                    weekKey,
                    conversationsAtStart: totalConversations,
                    flashcardsAtStart: totalFlashcards,
                    quizzesAtStart: totalQuizzes,
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
            }
        } else {
            data = {
                weekKey,
                conversationsAtStart: totalConversations,
                flashcardsAtStart: totalFlashcards,
                quizzesAtStart: totalQuizzes,
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        }

        setWeekData(data)
    }, [totalConversations, totalFlashcards, totalQuizzes])

    if (!weekData) return null

    const conversationsThisWeek = Math.max(0, totalConversations - weekData.conversationsAtStart)
    const flashcardsThisWeek = Math.max(0, totalFlashcards - weekData.flashcardsAtStart)
    const quizzesThisWeek = Math.max(0, totalQuizzes - weekData.quizzesAtStart)

    const langPath = targetLanguage ? `/learn/language/${targetLanguage}` : '/learn/language'

    const challenges: Challenge[] = [
        {
            id: 'conversations',
            label: '3 Konversationen',
            description: 'Führe 3 Konversationsübungen durch',
            icon: MessageSquare,
            current: conversationsThisWeek,
            target: 3,
            href: targetLanguage ? `${langPath}/conversation` : '/learn/chat',
            color: 'text-blue-500',
        },
        {
            id: 'vocab',
            label: '30 Vokabeln lernen',
            description: 'Lerne oder wiederhole 30 Vokabeln',
            icon: BookOpen,
            current: flashcardsThisWeek,
            target: 30,
            href: langPath,
            color: 'text-green-500',
        },
        {
            id: 'reviews',
            label: 'Alle fälligen wiederholen',
            description: 'Wiederhole alle fälligen Karteikarten',
            icon: RotateCcw,
            current: dueFlashcards + dueVocab === 0 ? 1 : 0,
            target: 1,
            href: '/learn/flashcards/study',
            color: 'text-orange-500',
        },
        {
            id: 'quiz',
            label: '2 Quizze bestehen',
            description: 'Absolviere 2 Wissenstests',
            icon: Brain,
            current: quizzesThisWeek,
            target: 2,
            href: '/learn/quiz',
            color: 'text-purple-500',
        },
    ]

    const completedCount = challenges.filter(c => c.current >= c.target).length
    const allDone = completedCount === challenges.length

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <Card className={allDone ? 'border-green-500/30 bg-gradient-to-r from-green-500/5 to-background' : ''}>
                <CardContent className="p-4 space-y-3">
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${allDone ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                                <Target className={`h-4 w-4 ${allDone ? 'text-green-500' : 'text-primary'}`} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-semibold">
                                    Wochenherausforderung
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {allDone
                                        ? 'Alle Ziele erreicht — super Woche!'
                                        : `${completedCount} von ${challenges.length} geschafft`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Progress value={(completedCount / challenges.length) * 100} className="w-20 h-2" />
                            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-2 pt-1">
                        {challenges.map(c => {
                            const done = c.current >= c.target
                            const pct = Math.min(100, Math.round((c.current / c.target) * 100))
                            const Icon = c.icon

                            return (
                                <Link
                                    key={c.id}
                                    href={c.href}
                                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                                        done
                                            ? 'bg-green-500/5 border-green-500/20'
                                            : 'hover:bg-accent'
                                    }`}
                                >
                                    {done ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                    ) : (
                                        <Icon className={`h-5 w-5 shrink-0 ${c.color}`} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>
                                            {c.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{c.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs font-mono text-muted-foreground">
                                            {Math.min(c.current, c.target)}/{c.target}
                                        </span>
                                        <Progress value={pct} className="w-12 h-1.5" />
                                    </div>
                                </Link>
                            )
                        })}
                    </CollapsibleContent>
                </CardContent>
            </Card>
        </Collapsible>
    )
}
