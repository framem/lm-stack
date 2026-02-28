'use client'

import { useState, useEffect } from 'react'
import { Flame, Zap, Target, Award, ChevronDown } from 'lucide-react'
import { Progress } from '@/src/components/ui/progress'
import { getUserStats, getEarnedBadges, getAllBadges } from '@/src/actions/user-stats'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/src/components/ui/tooltip'

interface UserStatsData {
    currentStreak: number
    longestStreak: number
    dailyGoal: number
    dailyProgress: number
    totalXp: number
}

interface BadgeData {
    id: string
    icon: string
    title: string
    description: string
}

export function GamificationBar() {
    const [stats, setStats] = useState<UserStatsData | null>(null)
    const [earnedBadges, setEarnedBadges] = useState<BadgeData[]>([])
    const [allBadges, setAllBadges] = useState<BadgeData[]>([])
    const [showBadges, setShowBadges] = useState(false)

    useEffect(() => {
        getUserStats().then((s) => setStats(s as UserStatsData)).catch(console.error)
        getEarnedBadges().then(setEarnedBadges).catch(console.error)
        getAllBadges().then(setAllBadges).catch(console.error)
    }, [])

    if (!stats) return null

    const dailyPercent = stats.dailyGoal > 0
        ? Math.min(Math.round((stats.dailyProgress / stats.dailyGoal) * 100), 100)
        : 0
    const goalReached = stats.dailyProgress >= stats.dailyGoal
    const earnedIds = new Set(earnedBadges.map((b) => b.id))

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
                {/* Streak */}
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${stats.currentStreak > 0 ? 'bg-orange-100 dark:bg-orange-950' : 'bg-muted'}`}>
                        <Flame className={`h-4 w-4 ${stats.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                        <p className="text-lg font-bold leading-none">{stats.currentStreak}</p>
                        <p className="text-xs text-muted-foreground">
                            {stats.currentStreak === 1 ? 'Tag' : 'Tage'} Streak
                        </p>
                    </div>
                </div>

                <div className="h-8 w-px bg-border hidden sm:block" />

                {/* Daily progress */}
                <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                    <div className={`p-1.5 rounded-lg ${goalReached ? 'bg-green-100 dark:bg-green-950' : 'bg-blue-100 dark:bg-blue-950'}`}>
                        <Target className={`h-4 w-4 ${goalReached ? 'text-green-500' : 'text-blue-500'}`} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Tagesziel</span>
                            <span className="font-medium">
                                {stats.dailyProgress}/{stats.dailyGoal}
                            </span>
                        </div>
                        <Progress value={dailyPercent} className="h-2" />
                    </div>
                </div>

                <div className="h-8 w-px bg-border hidden sm:block" />

                {/* XP */}
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950">
                        <Zap className="h-4 w-4 text-violet-500" />
                    </div>
                    <div>
                        <p className="text-lg font-bold leading-none">{stats.totalXp.toLocaleString('de-DE')}</p>
                        <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                </div>

                <div className="h-8 w-px bg-border hidden sm:block" />

                {/* Badges summary */}
                <button
                    type="button"
                    onClick={() => setShowBadges(!showBadges)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-accent"
                >
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950">
                        <Award className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-left">
                        <p className="text-lg font-bold leading-none">{earnedBadges.length}<span className="text-sm font-normal text-muted-foreground">/{allBadges.length}</span></p>
                        <p className="text-xs text-muted-foreground">Badges</p>
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showBadges ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Badge grid */}
            {showBadges && (
                <div className="rounded-xl border bg-card p-4">
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-3">
                        {allBadges.map((badge) => {
                            const earned = earnedIds.has(badge.id)
                            return (
                                <Tooltip key={badge.id}>
                                    <TooltipTrigger asChild>
                                        <div className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                                            earned
                                                ? 'bg-amber-50 dark:bg-amber-950/30'
                                                : 'opacity-30 grayscale'
                                        }`}>
                                            <span className="text-2xl">{badge.icon}</span>
                                            <span className="text-[10px] text-center leading-tight font-medium truncate w-full">
                                                {badge.title}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-medium">{badge.title}</p>
                                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                                        {!earned && <p className="text-xs text-muted-foreground mt-1">Noch nicht freigeschaltet</p>}
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
