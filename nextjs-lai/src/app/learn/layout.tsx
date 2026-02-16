import { Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'
import { AppSidebar } from '@/src/components/Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/src/components/ui/sidebar'
import { TooltipProvider } from '@/src/components/ui/tooltip'
import { Separator } from '@/src/components/ui/separator'
import { Breadcrumbs } from '@/src/components/Breadcrumbs'
import { checkLLMHealth } from '@/src/lib/health'

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const llmHealthy = await checkLLMHealth()

    return (
        <TooltipProvider>
            <SidebarProvider>
                <Suspense>
                    <AppSidebar />
                </Suspense>
                <SidebarInset>
                    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumbs />
                    </header>
                    {!llmHealthy && (
                        <div className="flex items-center gap-2 border-b border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-sm text-orange-400">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>
                                KI-Server nicht erreichbar — bitte Ollama oder LM Studio starten. Chat und Quiz-Generierung sind derzeit nicht verfuegbar.
                            </span>
                        </div>
                    )}
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    )
}
