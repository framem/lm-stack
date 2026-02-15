'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import {
    ChevronRight,
    Ellipsis,
    FileText,
    HelpCircle,
    Home,
    Layers,
    MessageSquare,
    Moon,
    Plus,
    Settings,
    Sun,
    Trash2,
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
import { getSessions, deleteSession } from '@/src/actions/chat'

interface SessionItem {
    id: string
    title: string | null
}

// Main navigation items (without Chat — handled separately)
const navItems = [
    { href: '/learn', label: 'Dashboard', icon: Home },
    { href: '/learn/documents', label: 'Lernmaterial', icon: FileText },
    { href: '/learn/quiz', label: 'Quiz', icon: HelpCircle },
    { href: '/learn/flashcards', label: 'Karteikarten', icon: Layers },
]

export function AppSidebar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const activeSessionId = searchParams.get('sessionId')
    const [sessions, setSessions] = useState<SessionItem[]>([])

    async function handleDelete(sessionId: string) {
        await deleteSession(sessionId)
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        // If the user is viewing the deleted session, redirect to a fresh chat
        if (activeSessionId === sessionId) {
            router.push('/learn/chat')
        }
    }

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
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton asChild>
                                                    <Link href="/learn/chat">
                                                        <Plus className="size-3" />
                                                        <span>Neuer Chat</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                            <SidebarSeparator className="mx-0" />
                                            {sessions.length === 0 ? (
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
                            tooltip={theme === 'dark' ? 'Hellmodus' : 'Dunkelmodus'}
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            <Sun className="size-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute size-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                            <span>{theme === 'dark' ? 'Hellmodus' : 'Dunkelmodus'}</span>
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
