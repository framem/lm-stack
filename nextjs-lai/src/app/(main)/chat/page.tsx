'use client'

import { useSearchParams } from 'next/navigation'
import { ChatInterface } from '@/src/components/ChatInterface'

export default function ChatPage() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('sessionId') ?? undefined
    const documentId = searchParams.get('documentId') ?? undefined

    return (
        <div className="flex flex-col h-[calc(100vh-3rem)]">
            <ChatInterface
                key={sessionId ?? '__new__'}
                sessionId={sessionId}
                documentId={!sessionId ? documentId : undefined}
            />
        </div>
    )
}
