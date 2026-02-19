'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useBreadcrumb } from '@/src/contexts/BreadcrumbContext'

// Static titles for dynamic language-set segments (avoids importing full vocab data)
const LANGUAGE_SET_TITLES: Record<string, string> = {
    'es-a1': 'Spanisch A1 Grundwortschatz',
    'en-a1': 'Englisch A1 Grundwortschatz',
    'es-a2': 'Spanisch A2 Grundwortschatz',
    'en-a2': 'Englisch A2 Grundwortschatz',
}

const ROUTE_LABELS: Record<string, string> = {
    '/learn': 'Dashboard',
    '/learn/admin': 'Admin',
    '/learn/chat': 'Chat',
    '/learn/conversation': 'Konversation',
    '/learn/daily': 'Tagesaufgabe',
    '/learn/documents': 'Lernmaterial',
    '/learn/flashcards': 'Karteikarten',
    '/learn/flashcards/study': 'Lernen',
    '/learn/knowledge-map': 'Wissenskarte',
'/learn/placement-test': 'Einstufungstest',
    '/learn/plan': 'Lernplan',
    '/learn/progress': 'Fortschritt',
    '/learn/quiz': 'Quiz',
    '/learn/quiz/review': 'Auswertung',
    '/learn/session': 'Lern-Session',
    '/learn/stats': 'Statistiken',
    '/learn/subjects': 'Fächer',
    '/learn/vocabulary': 'Vokabeltrainer',
    '/learn/vocabulary/sets': 'Sets',
    '/learn/vocabulary/study': 'Üben',
}

export function Breadcrumbs() {
    const pathname = usePathname()
    const { currentPageTitle } = useBreadcrumb()

    const parts = pathname.split('/').filter(Boolean) // ['learn', 'vocabulary', 'sets', 'es-a1']
    const isRootLearn = pathname === '/learn'

    const segments: { label: string; href: string }[] = []

    if (isRootLearn) {
        segments.push({ label: 'Dashboard', href: '/learn' })
    } else {
        // Walk path segments, skip dynamic (no label found) and skip /learn itself
        let currentPath = ''
        for (const part of parts) {
            currentPath += `/${part}`
            if (currentPath === '/learn') continue // suppress "Dashboard" for sub-pages
            const label = ROUTE_LABELS[currentPath] ?? LANGUAGE_SET_TITLES[part]
            if (label) {
                segments.push({ label, href: currentPath })
            }
            // Other dynamic segments (no label) are skipped;
            // they appear via currentPageTitle if the page sets it
        }
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
