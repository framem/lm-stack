'use client'

import { useState } from 'react'
import { Flame, Target, Trophy, Pencil, Check, Zap } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Progress } from '@/src/components/ui/progress'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { updateDailyGoal } from '@/src/actions/user-stats'

interface StreakDisplayProps {
    currentStreak: number
    longestStreak: number
    dailyGoal: number
    dailyProgress: number
    totalXp?: number
}

export function StreakDisplay({
    currentStreak,
    longestStreak,
    dailyGoal,
    dailyProgress,
    totalXp = 0,
}: StreakDisplayProps) {
    const [editing, setEditing] = useState(false)
    const [goalInput, setGoalInput] = useState(String(dailyGoal))
    const [goal, setGoal] = useState(dailyGoal)

    const progressPercent = goal > 0 ? Math.min(100, Math.round((dailyProgress / goal) * 100)) : 0
    const isRecord = currentStreak > 0 && currentStreak >= longestStreak

    async function handleSaveGoal() {
        const parsed = parseInt(goalInput, 10)
        if (isNaN(parsed) || parsed < 1 || parsed > 100) return
        try {
            await updateDailyGoal(parsed)
            setGoal(parsed)
            setEditing(false)
        } catch {
            // ignore
        }
    }

    return (
        <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-background to-red-500/5">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    {/* Streak counter */}
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-orange-500/10">
                            <Flame className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold">{currentStreak}</span>
                                <span className="text-sm text-muted-foreground">
                                    {currentStreak === 1 ? 'Tag' : 'Tage'} in Folge
                                </span>
                            </div>
                            {isRecord && currentStreak > 1 && (
                                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                    <Trophy className="h-3 w-3" />
                                    Persönlicher Rekord!
                                </div>
                            )}
                            {!isRecord && longestStreak > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Rekord: {longestStreak} Tage
                                </p>
                            )}
                        </div>
                    </div>

                    {/* XP counter */}
                    {totalXp > 0 && (
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <div>
                                <span className="text-lg font-bold">{totalXp.toLocaleString('de-DE')}</span>
                                <span className="text-xs text-muted-foreground ml-1">XP</span>
                            </div>
                        </div>
                    )}

                    {/* Daily goal progress */}
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                Tagesziel
                            </div>
                            {editing ? (
                                <div className="flex items-center gap-1">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={goalInput}
                                        onChange={(e) => setGoalInput(e.target.value)}
                                        className="h-7 w-16 text-xs"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveGoal()
                                            if (e.key === 'Escape') setEditing(false)
                                        }}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={handleSaveGoal}
                                    >
                                        <Check className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        setGoalInput(String(goal))
                                        setEditing(true)
                                    }}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {dailyProgress}/{goal}
                                    <Pencil className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                        {progressPercent >= 100 && (
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                Tagesziel erreicht!
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
