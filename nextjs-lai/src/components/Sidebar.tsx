'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import {
    BarChart3,
    Bookmark,
    ChevronRight,
    Ellipsis,
    FileText,
    FolderOpen,
    GraduationCap,
    HelpCircle,
    Home,
    Languages,
    Layers,
    MessageSquare,
    Moon,
    Plus,
    Route,
    Search,
    Settings,
    Sun,
    Trash2,
    X,
} from 'lucide-react'
import {
    Sidebar as SidebarRoot,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarFooter,
    SidebarRail,
    SidebarSeparator,
} from '@/src/components/ui/sidebar'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/src/components/ui/collapsible'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { Input } from '@/src/components/ui/input'
import { Progress } from '@/src/components/ui/progress'
import { getSessions, deleteSession, searchMessages, getBookmarkedMessages } from '@/src/actions/chat'
import { getSubjectOverview } from '@/src/actions/subjects'

interface SessionItem {
    id: string
    title: string | null
}

// Main navigation items (without Chat and Fächer — handled separately)
const navItems = [
    { href: '/learn', label: 'Dashboard', icon: Home },
    { href: '/learn/documents', label: 'Lernmaterial', icon: FileText },
    { href: '/learn/quiz', label: 'Quiz', icon: HelpCircle },
    { href: '/learn/flashcards', label: 'Karteikarten', icon: Layers },
    { href: '/learn/vocabulary', label: 'Vokabeltrainer', icon: Languages },
    { href: '/learn/session', label: 'Lern-Session', icon: GraduationCap },
    { href: '/learn/paths', label: 'Lernpfad', icon: Route },
    { href: '/learn/stats', label: 'Statistiken', icon: BarChart3 },
]

interface SubjectItem {
    subject: string
    avgProgress: number
    dueReviews: number
}

export function AppSidebar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { resolvedTheme, setTheme } = useTheme()
    const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
    const activeSessionId = searchParams.get('sessionId')
    const [subjects, setSubjects] = useState<SubjectItem[]>([])
    const [sessions, setSessions] = useState<SessionItem[]>([])
    const [chatView, setChatView] = useState<'sessions' | 'search' | 'bookmarks'>('sessions')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<{
        id: string
        sessionId: string
        sessionTitle: string | null
        headline: string
    }[]>([])
    const [bookmarks, setBookmarks] = useState<{
        id: string
        content: string
        session: { id: string; title: string | null }
    }[]>([])
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    async function handleDelete(sessionId: string) {
        await deleteSession(sessionId)
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        // If the user is viewing the deleted session, redirect to a fresh chat
        if (activeSessionId === sessionId) {
            router.push('/learn/chat')
        }
    }


    function handleSearchChange(query: string) {
        setSearchQuery(query)
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        if (!query.trim()) {
            setSearchResults([])
            return
        }
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await searchMessages(query)
                setSearchResults(results as typeof searchResults)
            } catch {
                setSearchResults([])
            }
        }, 300)
    }

    async function loadBookmarks() {
        try {
            const bm = await getBookmarkedMessages()
            setBookmarks(bm as typeof bookmarks)
        } catch {
            setBookmarks([])
        }
    }

    // Fetch subjects for the sidebar
    useEffect(() => {
        getSubjectOverview()
            .then((data) => setSubjects(
                data.map((s) => ({ subject: s.subject, avgProgress: s.avgProgress, dueReviews: s.dueReviews }))
            ))
            .catch(() => {})
    }, [])

    // Fetch sessions on mount and whenever a new session is created
    useEffect(() => {
        function fetchSessions() {
            getSessions()
                .then((data) =>
                    setSessions(
                        (data as unknown as SessionItem[]).map((s) => ({
                            id: s.id,
                            title: s.title,
                        }))
                    )
                )
                .catch(() => {})
        }

        fetchSessions()
        window.addEventListener('session-created', fetchSessions)
        return () => window.removeEventListener('session-created', fetchSessions)
    }, [])

    const isSubjectsActive = pathname.startsWith('/learn/subjects')
    const isChatActive = pathname.startsWith('/learn/chat')

    return (
        <SidebarRoot collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Image src="/images/fox.png" alt="Fox Logo" width={48} height={48} />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-bold">LAI</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        Lernplattform mit KI
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Main navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const isActive =
                                    pathname === item.href ||
                                    (item.href !== '/learn' && pathname.startsWith(item.href))
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.label}
                                        >
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}

                            {/* Fächer with collapsible subject list */}
                            <Collapsible
                                asChild
                                defaultOpen
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            isActive={isSubjectsActive}
                                            tooltip="Fächer"
                                        >
                                            <FolderOpen />
                                            <span>Fächer</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {subjects.length === 0 ? (
                                                <SidebarMenuSubItem>
                                                    <span className="px-2 py-1.5 text-xs text-muted-foreground">
                                                        Keine Fächer
                                                    </span>
                                                </SidebarMenuSubItem>
                                            ) : (
                                                subjects.map((s) => (
                                                    <SidebarMenuSubItem key={s.subject}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={pathname === `/learn/subjects/${encodeURIComponent(s.subject)}`}
                                                        >
                                                            <Link href={`/learn/subjects/${encodeURIComponent(s.subject)}`}>
                                                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="truncate text-sm">{s.subject}</span>
                                                                        <span className="ml-2 shrink-0 text-[10px] tabular-nums text-muted-foreground">
                                                                            {s.avgProgress}%
                                                                        </span>
                                                                    </div>
                                                                    <Progress value={s.avgProgress} className="h-1" />
                                                                </div>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))
                                            )}
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild>
                                                    <Link href="/learn/subjects" className="text-muted-foreground">
                                                        <span>Alle Fächer</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

                            {/* Chat with collapsible session list */}
                            <Collapsible
                                asChild
                                defaultOpen={isChatActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            isActive={isChatActive}
                                            tooltip="Chat"
                                        >
                                            <MessageSquare />
                                            <span>Chat</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {/* Action row: New chat + Search + Bookmarks */}
                                            <SidebarMenuSubItem>
                                                <div className="flex items-center gap-1 px-1 py-1">
                                                    <SidebarMenuSubButton asChild className="flex-1">
                                                        <Link href="/learn/chat">
                                                            <Plus className="size-3" />
                                                            <span>Neuer Chat</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setChatView(chatView === 'search' ? 'sessions' : 'search')
                                                            setSearchQuery('')
                                                            setSearchResults([])
                                                        }}
                                                        className={`rounded p-1 transition-colors hover:bg-accent ${chatView === 'search' ? 'text-primary' : 'text-muted-foreground'}`}
                                                        title="Chat durchsuchen"
                                                    >
                                                        <Search className="size-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (chatView === 'bookmarks') {
                                                                setChatView('sessions')
                                                            } else {
                                                                setChatView('bookmarks')
                                                                loadBookmarks()
                                                            }
                                                        }}
                                                        className={`rounded p-1 transition-colors hover:bg-accent ${chatView === 'bookmarks' ? 'text-primary' : 'text-muted-foreground'}`}
                                                        title="Lesezeichen"
                                                    >
                                                        <Bookmark className="size-3.5" />
                                                    </button>
                                                </div>
                                            </SidebarMenuSubItem>

                                            {/* Search input */}
                                            {chatView === 'search' && (
                                                <SidebarMenuSubItem>
                                                    <div className="px-2 pb-1.5">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                                                            <Input
                                                                value={searchQuery}
                                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                                placeholder="Nachrichten suchen..."
                                                                className="h-7 pl-7 pr-7 text-xs"
                                                                autoFocus
                                                            />
                                                            {searchQuery && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                                                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                                >
                                                                    <X className="size-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </SidebarMenuSubItem>
                                            )}

                                            <SidebarSeparator className="mx-0" />

                                            {/* Search results */}
                                            {chatView === 'search' && (
                                                searchResults.length === 0 ? (
                                                    <SidebarMenuSubItem>
                                                        <span className="px-2 py-1.5 text-xs text-muted-foreground">
                                                            {searchQuery ? 'Keine Treffer' : 'Suchbegriff eingeben...'}
                                                        </span>
                                                    </SidebarMenuSubItem>
                                                ) : (
                                                    searchResults.map((r) => (
                                                        <SidebarMenuSubItem key={r.id}>
                                                            <SidebarMenuSubButton asChild>
                                                                <Link href={`/learn/chat?sessionId=${r.sessionId}`}>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-medium truncate">
                                                                            {r.sessionTitle || 'Unbenannter Chat'}
                                                                        </p>
                                                                        <p
                                                                            className="text-xs text-muted-foreground truncate [&_mark]:bg-primary/20 [&_mark]:text-foreground [&_mark]:rounded-sm"
                                                                            dangerouslySetInnerHTML={{ __html: r.headline }}
                                                                        />
                                                                    </div>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))
                                                )
                                            )}

                                            {/* Bookmarks view */}
                                            {chatView === 'bookmarks' && (
                                                bookmarks.length === 0 ? (
                                                    <SidebarMenuSubItem>
                                                        <span className="px-2 py-1.5 text-xs text-muted-foreground">
                                                            Keine Lesezeichen
                                                        </span>
                                                    </SidebarMenuSubItem>
                                                ) : (
                                                    bookmarks.map((bm) => (
                                                        <SidebarMenuSubItem key={bm.id}>
                                                            <SidebarMenuSubButton asChild>
                                                                <Link href={`/learn/chat?sessionId=${bm.session.id}`}>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-medium truncate">
                                                                            {bm.session.title || 'Unbenannter Chat'}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground truncate">
                                                                            {bm.content.slice(0, 80)}{bm.content.length > 80 ? '…' : ''}
                                                                        </p>
                                                                    </div>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))
                                                )
                                            )}

                                            {/* Session list (default view) */}
                                            {chatView === 'sessions' && (
                                                sessions.length === 0 ? (
                                                    <SidebarMenuSubItem>
                                                        <span className="px-2 py-1.5 text-xs text-muted-foreground">
                                                            Keine Sitzungen
                                                        </span>
                                                    </SidebarMenuSubItem>
                                                ) : (
                                                    sessions.map((session) => (
                                                        <SidebarMenuSubItem key={session.id} className="group/session relative">
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                isActive={activeSessionId === session.id}
                                                            >
                                                                <Link href={`/learn/chat?sessionId=${session.id}`}>
                                                                    <span className="truncate pr-5">
                                                                        {session.title || 'Unbenannter Chat'}
                                                                    </span>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 transition-opacity hover:bg-accent group-hover/session:opacity-100 data-[state=open]:opacity-100"
                                                                    >
                                                                        <Ellipsis className="size-3.5 text-muted-foreground" />
                                                                    </button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent side="right" align="start">
                                                                    <DropdownMenuItem
                                                                        variant="destructive"
                                                                        onClick={() => handleDelete(session.id)}
                                                                    >
                                                                        <Trash2 />
                                                                        <span>Löschen</span>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </SidebarMenuSubItem>
                                                    ))
                                                )
                                            )}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip={mounted ? (resolvedTheme === 'dark' ? 'Hellmodus' : 'Dunkelmodus') : 'Design'}
                            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        >
                            <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                            <span>{mounted ? (resolvedTheme === 'dark' ? 'Hellmodus' : 'Dunkelmodus') : 'Design'}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === '/learn/admin' || pathname.startsWith('/learn/admin')}
                            tooltip="Admin"
                        >
                            <Link href="/learn/admin">
                                <Settings />
                                <span>Admin</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </SidebarRoot>
    )
}
