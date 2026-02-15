'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/utils'
import { BarChart3, BookText, Brain, FlaskConical, GitCompare, Grid3X3, MessageSquare, Home, BookOpen, Shuffle } from 'lucide-react'

const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/texts', label: 'Texte', icon: BookText },
    { href: '/models', label: 'Modelle', icon: Brain },
    { href: '/rerankers', label: 'Reranker', icon: Shuffle },
    { href: '/phrases', label: 'Suchphrasen', icon: MessageSquare },
    { href: '/embed', label: 'Embedding', icon: FlaskConical },
    { href: '/evaluate', label: 'Auswertung', icon: BarChart3 },
    { href: '/compare', label: 'Vergleich', icon: GitCompare },
    { href: '/grid-search', label: 'Grid-Search', icon: Grid3X3 },
    { href: '/guide', label: 'Anleitung', icon: BookOpen },
]

export function Navigation() {
    const pathname = usePathname()

    return (
        <nav className="border-b bg-card">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex h-14 items-center gap-1">
                    <Link href="/" className="mr-6 font-semibold text-lg">
                        Embed-Eval
                    </Link>
                    {navItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                pathname === href
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    )
}
