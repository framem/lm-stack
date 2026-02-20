'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'
import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
} from '@/src/components/ai-elements/conversation'
import {
    Message,
    MessageContent,
    MessageResponse,
} from '@/src/components/ai-elements/message'
import {
    PromptInput,
    PromptInputFooter,
    PromptInputSubmit,
    PromptInputTextarea,
} from '@/src/components/ai-elements/prompt-input'

const transport = new DefaultChatTransport({ api: '/api/assistant' })

export function FoxChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const { messages, sendMessage, status, stop } = useChat({ transport })

    return (
        <>
            {/* Floating toggle button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-background shadow-lg transition-transform hover:scale-105 cursor-pointer"
                aria-label={isOpen ? 'Chat schließen' : 'Chat öffnen'}
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-foreground" />
                ) : (
                    <Image
                        src="/images/fox.png"
                        alt="Fuchsi"
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                )}
            </button>

            {/* Chat panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl">
                    {/* Header */}
                    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-secondary/50 px-4 py-3">
                        <Image
                            src="/images/fox.png"
                            alt="Fuchsi"
                            width={32}
                            height={32}
                            className="rounded-full"
                        />
                        <div>
                            <h3 className="text-sm font-semibold text-foreground">Fuchsi</h3>
                            <p className="text-xs text-muted-foreground">Dein Lernassistent</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <Conversation className="flex-1">
                        <ConversationContent>
                            {messages.length === 0 ? (
                                <ConversationEmptyState
                                    icon={
                                        <Image
                                            src="/images/fox.png"
                                            alt="Fuchsi"
                                            width={48}
                                            height={48}
                                            className="rounded-full"
                                        />
                                    }
                                    title="Hallo! Ich bin Fuchsi"
                                    description="Frag mich alles über deine Lernmaterialien!"
                                />
                            ) : (
                                messages
                                    .filter((m) => m.role !== 'system')
                                    .map((message) => (
                                        <Message key={message.id} from={message.role}>
                                            <MessageContent>
                                                {message.parts
                                                    .filter(
                                                        (p): p is { type: 'text'; text: string } =>
                                                            p.type === 'text',
                                                    )
                                                    .map((part, i) => (
                                                        <MessageResponse key={`${message.id}-${i}`}>
                                                            {part.text}
                                                        </MessageResponse>
                                                    ))}
                                            </MessageContent>
                                        </Message>
                                    ))
                            )}
                        </ConversationContent>
                        <ConversationScrollButton />
                    </Conversation>

                    {/* Input */}
                    <div className="shrink-0 border-t border-border p-3">
                        <PromptInput
                            onSubmit={({ text }) => {
                                if (text.trim()) sendMessage({ text })
                            }}
                        >
                            <PromptInputTextarea placeholder="Frag Fuchsi etwas..." />
                            <PromptInputFooter>
                                <PromptInputSubmit status={status} onStop={stop} />
                            </PromptInputFooter>
                        </PromptInput>
                    </div>
                </div>
            )}
        </>
    )
}
