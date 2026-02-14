import { ChatInterface } from '@/src/components/ChatInterface'

export const metadata = {
    title: 'Chat - LAI',
    description: 'KI-Lernassistent mit RAG',
}

export default function ChatPage() {
    return (
        <div className="h-full">
            <div className="border-b border-border px-6 py-4">
                <h1 className="text-xl font-bold">Chat</h1>
                <p className="text-sm text-muted-foreground">
                    Stelle Fragen zu deinen Dokumenten
                </p>
            </div>
            <ChatInterface />
        </div>
    )
}
