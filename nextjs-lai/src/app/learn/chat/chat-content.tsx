'use client'

import { useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChatInterface } from '@/src/components/ChatInterface'

export function ChatContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const sessionId = searchParams.get('sessionId') ?? undefined
    const documentId = searchParams.get('documentId') ?? undefined

    const handleSessionCreated = useCallback(
        (newSessionId: string) => {
            router.replace(`/learn/chat?sessionId=${newSessionId}`, { scroll: false })
            // Notify sidebar to refresh its session list
            window.dispatchEvent(new CustomEvent('session-created'))
        },
        [router]
    )

    return (
        <div className="flex flex-col h-[calc(100vh-3rem)]">
            <ChatInterface
                sessionId={sessionId}
                documentId={!sessionId ? documentId : undefined}
                onSessionCreated={handleSessionCreated}
            />
        </div>
    )
}
