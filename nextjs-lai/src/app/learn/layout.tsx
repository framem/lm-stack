import { Suspense } from 'react'
import { AppSidebar } from '@/src/components/Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/src/components/ui/sidebar'
import { TooltipProvider } from '@/src/components/ui/tooltip'
import { Separator } from '@/src/components/ui/separator'
import { Breadcrumbs } from '@/src/components/Breadcrumbs'
import { LLMHealthBanner } from '@/src/components/LLMHealthBanner'
import { BreadcrumbProvider } from '@/src/contexts/BreadcrumbContext'
import { GlobalSearch } from '@/src/components/GlobalSearchClient'
import { FoxChatbot } from '@/src/components/FoxChatbot'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <TooltipProvider>
            <BreadcrumbProvider>
                <SidebarProvider>
                    <Suspense>
                        <AppSidebar />
                    </Suspense>
                    <SidebarInset>
                        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumbs />
                            <GlobalSearch />
                        </header>
                        <LLMHealthBanner />
                        <main className="flex-1 overflow-auto">
                            {children}
                        </main>
                    </SidebarInset>
                </SidebarProvider>
            </BreadcrumbProvider>
            <FoxChatbot />
        </TooltipProvider>
    )
}
