'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useBreadcrumb } from '@/src/contexts/BreadcrumbContext'

const ROUTE_LABELS: Record<string, string> = {
    '/learn': 'Dashboard',
    '/learn/documents': 'Lernmaterial',
    '/learn/chat': 'Chat',
    '/learn/quiz': 'Quiz',
    '/learn/admin': 'Admin',
}

export function Breadcrumbs() {
    const pathname = usePathname()
    const { currentPageTitle } = useBreadcrumb()

    // Build breadcrumb segments from pathname
    const segments: { label: string; href: string }[] = []

    if (pathname === '/learn') {
        segments.push({ label: 'Dashboard', href: '/learn' })
    } else {
        // Find the matching route label
        const parts = pathname.split('/').filter(Boolean) // e.g. ['learn', 'documents', 'abc123']
        let currentPath = ''
        for (const part of parts) {
            currentPath += `/${part}`
            const label = ROUTE_LABELS[currentPath]
            if (label) {
                segments.push({ label, href: currentPath })
            }
        }
        // If we're on a detail page (e.g. /learn/documents/[id] or /learn/quiz/[id]),
        // don't add the dynamic segment — the page title will show in the page itself
    }

    if (segments.length === 0) {
        return <span className="text-sm text-muted-foreground">LAI</span>
    }

    return (
        <nav className="flex items-center gap-1 text-sm">
            <Link href="/learn" className="text-muted-foreground hover:text-foreground transition-colors">
                LAI
            </Link>
            {segments.map((segment) => (
                <span key={segment.href} className="flex items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <Link href={segment.href} className="text-muted-foreground hover:text-foreground transition-colors">
                        {segment.label}
                    </Link>
                </span>
            ))}
            {currentPageTitle && (
                <span className="flex items-center gap-1">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <span className="font-medium text-foreground">{currentPageTitle}</span>
                </span>
            )}
        </nav>
    )
}
