'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Award,
    CheckCircle2,
    Copy,
    Flame,
    Plus,
    Target,
    Timer,
    Trash2,
    Trophy,
    Zap,
} from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/src/components/ui/tooltip'
import {
    createChallenge,
    deleteChallenge,
    updateChallengeProgress,
} from '@/src/actions/weekly-challenges'
import { CHALLENGE_TEMPLATES, type ChallengeTemplate } from '@/src/data/challenge-templates'

// ── Types ──

interface UserStats {
    currentStreak: number
    longestStreak: number
    dailyGoal: number
    dailyProgress: number
    totalXp: number
}

interface BadgeWithProgress {
    id: string
    icon: string
    title: string
    description: string
    earned: boolean
    progress?: { current: number; target: number }
}

interface Challenge {
    id: string
    title: string
    description: string
    area: string
    targetValue: number
    currentValue: number
    startDate: string | Date
    endDate: string | Date
    completed: boolean
}

interface LeaderboardContentProps {
    userStats: UserStats
    badges: BadgeWithProgress[]
    activeChallenges: Challenge[]
    completedChallenges: Challenge[]
    challengeStats: { totalCompleted: number; totalCreated: number }
}

// ── XP level computation ──

function computeLevel(xp: number): { level: number; currentXp: number; nextLevelXp: number } {
    // Simple leveling: each level requires 100 more XP than the previous
    let level = 1
    let remaining = xp
    let required = 100

    while (remaining >= required) {
        remaining -= required
        level++
        required = level * 100
    }

    return { level, currentXp: remaining, nextLevelXp: required }
}

// ── Main component ──

export function LeaderboardContent({
    userStats,
    badges,
    activeChallenges: initialChallenges,
    completedChallenges,
    challengeStats,
}: LeaderboardContentProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showTemplates, setShowTemplates] = useState(false)
    const [copied, setCopied] = useState(false)

    const { level, currentXp, nextLevelXp } = computeLevel(userStats.totalXp)
    const levelPercent = Math.round((currentXp / nextLevelXp) * 100)
    const earnedBadges = badges.filter((b) => b.earned)

    // ── Handlers ──

    function handleCreateChallenge(template: ChallengeTemplate) {
        startTransition(async () => {
            await createChallenge(template)
            setShowTemplates(false)
            router.refresh()
        })
    }

    function handleDeleteChallenge(id: string) {
        startTransition(async () => {
            await deleteChallenge(id)
            router.refresh()
        })
    }

    function handleIncrementChallenge(challenge: Challenge) {
        startTransition(async () => {
            await updateChallengeProgress(challenge.id, challenge.currentValue + 1)
            router.refresh()
        })
    }

    function handleShareAchievements() {
        const text = [
            `Meine Lernstatistiken:`,
            `Level ${level} | ${userStats.totalXp.toLocaleString('de-DE')} XP`,
            `Streak: ${userStats.currentStreak} Tage (Rekord: ${userStats.longestStreak})`,
            `${earnedBadges.length}/${badges.length} Badges freigeschaltet`,
            `${challengeStats.totalCompleted} Challenges abgeschlossen`,
        ].join('\n')

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    // ── Days remaining helper ──

    function daysRemaining(endDate: string | Date): number {
        const end = new Date(endDate)
        const now = new Date()
        return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/learn/language">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-primary" />
                        Bestenliste & Erfolge
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Deine Lernfortschritte und Herausforderungen
                    </p>
                </div>
            </div>

            {/* ── Level & XP Card ── */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-background">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Dein Level</p>
                            <p className="text-4xl font-bold">{level}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Gesamt-XP</p>
                            <p className="text-2xl font-bold flex items-center gap-1">
                                <Zap className="h-5 w-5 text-violet-500" />
                                {userStats.totalXp.toLocaleString('de-DE')}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Level {level}</span>
                            <span>{currentXp} / {nextLevelXp} XP</span>
                            <span>Level {level + 1}</span>
                        </div>
                        <Progress value={levelPercent} className="h-3" />
                    </div>
                </CardContent>
            </Card>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
                            <Flame className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{userStats.currentStreak}</p>
                            <p className="text-xs text-muted-foreground">Tage Streak</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950">
                            <Trophy className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{userStats.longestStreak}</p>
                            <p className="text-xs text-muted-foreground">Rekord-Streak</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{challengeStats.totalCompleted}</p>
                            <p className="text-xs text-muted-foreground">Challenges</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950">
                            <Award className="h-4 w-4 text-violet-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{earnedBadges.length}</p>
                            <p className="text-xs text-muted-foreground">Badges</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Weekly Challenges ── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Wochen-Challenges
                            </CardTitle>
                            <CardDescription>
                                Setze dir wöchentliche Ziele und verfolge deinen Fortschritt
                            </CardDescription>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowTemplates(!showTemplates)}
                        >
                            <Plus className="h-4 w-4" />
                            Neue Challenge
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Template picker */}
                    {showTemplates && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg border border-dashed">
                            {CHALLENGE_TEMPLATES.map((template, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleCreateChallenge(template)}
                                    className="text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <p className="font-medium text-sm">{template.title}</p>
                                    <p className="text-xs text-muted-foreground">{template.description}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Active challenges */}
                    {initialChallenges.length > 0 ? (
                        <div className="space-y-3">
                            {initialChallenges.map((challenge) => {
                                const percent = Math.min(
                                    Math.round((challenge.currentValue / challenge.targetValue) * 100),
                                    100,
                                )
                                const days = daysRemaining(challenge.endDate)

                                return (
                                    <div key={challenge.id} className="rounded-lg border p-4 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium flex items-center gap-2">
                                                    {challenge.title}
                                                    {challenge.completed && (
                                                        <Badge variant="default" className="text-xs">Geschafft!</Badge>
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{challenge.description}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {!challenge.completed && (
                                                    <Button
                                                        size="icon-xs"
                                                        variant="ghost"
                                                        disabled={isPending}
                                                        onClick={() => handleIncrementChallenge(challenge)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="icon-xs"
                                                    variant="ghost"
                                                    disabled={isPending}
                                                    onClick={() => handleDeleteChallenge(challenge.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{challenge.currentValue} / {challenge.targetValue}</span>
                                                <span className="flex items-center gap-1">
                                                    <Timer className="h-3 w-3" />
                                                    {days} {days === 1 ? 'Tag' : 'Tage'} übrig
                                                </span>
                                            </div>
                                            <Progress value={percent} className="h-2" />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Keine aktiven Challenges. Erstelle eine neue!
                        </p>
                    )}

                    {/* Completed challenges */}
                    {completedChallenges.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Abgeschlossen</p>
                            {completedChallenges.map((ch) => (
                                <div key={ch.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span className="text-sm">{ch.title}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(ch.endDate).toLocaleDateString('de-DE')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── All Badges ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Alle Badges ({earnedBadges.length}/{badges.length})
                    </CardTitle>
                    <CardDescription>
                        Schalte Badges frei, indem du Lernmeilensteine erreichst
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                        {badges.map((badge) => (
                            <Tooltip key={badge.id}>
                                <TooltipTrigger asChild>
                                    <div className={`flex flex-col items-center gap-1.5 rounded-lg p-3 transition-colors ${
                                        badge.earned
                                            ? 'bg-amber-50 dark:bg-amber-950/30'
                                            : 'opacity-30 grayscale'
                                    }`}>
                                        <span className="text-3xl">{badge.icon}</span>
                                        <span className="text-[11px] text-center leading-tight font-medium">
                                            {badge.title}
                                        </span>
                                        {!badge.earned && badge.progress && (
                                            <div className="w-full">
                                                <Progress
                                                    value={Math.round((badge.progress.current / badge.progress.target) * 100)}
                                                    className="h-1"
                                                />
                                                <p className="text-[9px] text-center text-muted-foreground mt-0.5">
                                                    {badge.progress.current}/{badge.progress.target}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-medium">{badge.title}</p>
                                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ── Share Achievements ── */}
            <Card>
                <CardContent className="flex items-center justify-between p-6">
                    <div>
                        <p className="font-semibold">Erfolge teilen</p>
                        <p className="text-sm text-muted-foreground">
                            Kopiere deine Lernstatistiken in die Zwischenablage
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleShareAchievements}>
                        <Copy className="h-4 w-4" />
                        {copied ? 'Kopiert!' : 'Kopieren'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
