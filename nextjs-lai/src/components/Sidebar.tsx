'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, MessageSquare, HelpCircle, Upload, Home } from 'lucide-react'
import { cn } from '@/src/lib/utils'

const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/upload', label: 'Hochladen', icon: Upload },
    { href: '/chat', label: 'Chat', icon: MessageSquare },
    { href: '/quiz', label: 'Quiz', icon: HelpCircle },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-border">
                <Link href="/" className="flex items-center gap-2">
                    <FileText className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold">LAI</span>
                </Link>
                <p className="text-xs text-muted-foreground mt-1">Lernplattform mit KI</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
