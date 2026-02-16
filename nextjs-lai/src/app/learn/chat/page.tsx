import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { ChatContent } from './chat-content'

export default function ChatPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <ChatContent />
        </Suspense>
    )
}
