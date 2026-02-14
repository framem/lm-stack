'use client'

import { useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChatInterface } from '@/src/components/ChatInterface'

export default function ChatPage() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('sessionId') ?? undefined
    const documentId = searchParams.get('documentId') ?? undefined

    const handleSessionCreated = useCallback(
        (newSessionId: string) => {
            // Update URL silently without triggering a re-render / remount
            window.history.replaceState(null, '', `/chat?sessionId=${newSessionId}`)
            // Notify sidebar to refresh its session list
            window.dispatchEvent(new CustomEvent('session-created'))
        },
        []
    )

    return (
        <div className="flex flex-col h-[calc(100vh-3rem)]">
            <ChatInterface
                key={sessionId ?? '__new__'}
                sessionId={sessionId}
                documentId={!sessionId ? documentId : undefined}
                onSessionCreated={handleSessionCreated}
            />
        </div>
    )
}
