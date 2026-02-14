import { AppSidebar } from '@/src/components/Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/src/components/ui/sidebar'
import { TooltipProvider } from '@/src/components/ui/tooltip'
import { Separator } from '@/src/components/ui/separator'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <span className="text-sm text-muted-foreground">LAI</span>
                    </header>
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    )
}
