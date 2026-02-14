'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from "next/image";
import { usePathname, useSearchParams } from 'next/navigation'
import {
    BookOpen,
    ChevronRight,
    FileText,
    HelpCircle,
    Home,
    MessageSquare,
    Plus,
    Settings,
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
    SidebarRail,
    SidebarSeparator,
} from '@/src/components/ui/sidebar'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/src/components/ui/collapsible'
import { getSessions } from '@/src/actions/chat'

interface SessionItem {
    id: string
    title: string | null
}

// Main navigation items (without Chat — handled separately)
const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/documents', label: 'Dokumente', icon: FileText },
    { href: '/quiz', label: 'Quiz', icon: HelpCircle },
    { href: '/admin', label: 'Admin', icon: Settings },
]

export function AppSidebar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const activeSessionId = searchParams.get('sessionId')
    const [sessions, setSessions] = useState<SessionItem[]>([])

    useEffect(() => {
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
    }, [])

    const isChatActive = pathname.startsWith('/chat')

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
                                    (item.href !== '/' && pathname.startsWith(item.href))
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
                                                    <Link href="/chat">
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
                                                    <SidebarMenuSubItem key={session.id}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={activeSessionId === session.id}
                                                        >
                                                            <Link href={`/chat?sessionId=${session.id}`}>
                                                                <span className="truncate">
                                                                    {session.title || 'Unbenannter Chat'}
                                                                </span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
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

            <SidebarRail />
        </SidebarRoot>
    )
}
