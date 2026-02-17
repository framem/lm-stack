import { Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { BADGES, type EarnedBadge } from '@/src/lib/badges'

interface BadgeShowcaseProps {
    earnedBadges: EarnedBadge[]
}

export function BadgeShowcase({ earnedBadges }: BadgeShowcaseProps) {
    const earnedIds = new Set(earnedBadges.map((b) => b.id))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Abzeichen ({earnedBadges.length}/{BADGES.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {BADGES.map((badge) => {
                        const earned = earnedIds.has(badge.id)
                        return (
                            <div
                                key={badge.id}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors ${
                                    earned
                                        ? 'border-primary/30 bg-primary/5'
                                        : 'border-dashed opacity-40'
                                }`}
                            >
                                <span className="text-2xl">{badge.icon}</span>
                                <span className="text-xs font-semibold leading-tight">{badge.title}</span>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                    {badge.description}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
