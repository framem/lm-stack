import { toast } from 'sonner'

interface BadgeInfo {
    icon: string
    title: string
    description: string
}

/** Show a toast notification for a newly unlocked badge */
export function BadgeUnlockToast(badge: BadgeInfo) {
    toast(badge.title, {
        description: badge.description,
        icon: badge.icon,
        duration: 5000,
        className: 'border-amber-500/50',
    })
}
