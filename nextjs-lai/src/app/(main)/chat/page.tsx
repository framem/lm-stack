'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChatInterface } from '@/src/components/ChatInterface'
import { Plus, MessageSquare, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface SessionSummary {
    id: string
    title: string | null
    createdAt: string
    updatedAt: string
    _count: { messages: number }
    document: { id: string; title: string } | null
}

export default function ChatPage() {
    const [sessions, setSessions] = useState<SessionSummary[]>([])
    const [activeSessionId, setActiveSessionId] = useState<string | undefined>()
    const [loading, setLoading] = useState(true)

    // Load sessions on mount
    useEffect(() => {
        async function loadSessions() {
            try {
                const res = await fetch('/api/chat/sessions')
                if (res.ok) {
                    const data: SessionSummary[] = await res.json()
                    setSessions(data)
                }
            } catch (err) {
                console.error('Failed to load sessions:', err)
            } finally {
                setLoading(false)
            }
        }
        loadSessions()
    }, [])

    // When ChatInterface creates a new session, add it to the list
    const handleSessionCreated = useCallback((sessionId: string, title: string) => {
        const newSession: SessionSummary = {
            id: sessionId,
            title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { messages: 1 },
            document: null,
        }
        setSessions((prev) => [newSession, ...prev])
        setActiveSessionId(sessionId)
    }, [])

    function startNewChat() {
        setActiveSessionId(undefined)
    }

    async function deleteSession(e: React.MouseEvent, sessionId: string) {
        e.stopPropagation()
        try {
            const res = await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' })
            if (res.ok) {
                setSessions((prev) => prev.filter((s) => s.id !== sessionId))
                if (activeSessionId === sessionId) {
                    setActiveSessionId(undefined)
                }
            }
        } catch (err) {
            console.error('Failed to delete session:', err)
        }
    }

    function formatDate(iso: string) {
        const d = new Date(iso)
        return d.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        })
    }

    return (
        <div className="flex h-full">
            {/* Session list panel */}
            <div className="w-72 border-r border-border bg-card flex flex-col">
                <div className="p-4 border-b border-border">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus className="h-4 w-4" />
                        Neuer Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Noch keine Sitzungen vorhanden.
                            </p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => setActiveSessionId(session.id)}
                                    className={cn(
                                        'w-full text-left rounded-lg px-3 py-2.5 transition-colors group',
                                        activeSessionId === session.id
                                            ? 'bg-accent text-accent-foreground'
                                            : 'hover:bg-accent/50 text-foreground'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium truncate flex-1">
                                            {session.title || 'Unbenannter Chat'}
                                        </p>
                                        <button
                                            onClick={(e) => deleteSession(e, session.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 transition-all text-muted-foreground hover:text-destructive flex-shrink-0"
                                            title="Sitzung löschen"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(session.updatedAt)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            · {session._count.messages} {session._count.messages === 1 ? 'Nachricht' : 'Nachrichten'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="border-b border-border px-6 py-4">
                    <h1 className="text-xl font-bold">Chat</h1>
                    <p className="text-sm text-muted-foreground">
                        Stelle Fragen zu deinen Dokumenten
                    </p>
                </div>
                <ChatInterface
                    key={activeSessionId ?? '__new__'}
                    sessionId={activeSessionId}
                    onSessionCreated={handleSessionCreated}
                />
            </div>
        </div>
    )
}
