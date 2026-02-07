'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChatMessage } from './ChatMessage'

const transport = new DefaultChatTransport({ api: '/api/chat' })

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const { messages, sendMessage, status } = useChat({ transport })

    const isLoading = status === 'streaming' || status === 'submitted'

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (isOpen) inputRef.current?.focus()
    }, [isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return
        sendMessage({ text: input })
        setInput('')
    }

    // Extract text parts from UIMessage
    const getMessageText = (message: (typeof messages)[number]) => {
        return message.parts
            .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
            .map(part => part.text)
            .join('')
    }

    return (
        <>
            {/* Chat toggle button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-black/50 text-xl cursor-pointer"
            >
                {isOpen ? '✕' : '💬'}
            </Button>

            {/* Chat panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[500px] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700">
                        <h3 className="text-sm font-semibold text-white">Film-Berater</h3>
                        <p className="text-xs text-zinc-400">Frag mich nach Filmempfehlungen!</p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                        {messages.length === 0 && (
                            <div className="text-zinc-500 text-sm text-center mt-8">
                                <p>Hallo! Ich kann dir Filme empfehlen.</p>
                                <p className="mt-2 text-xs">z.B. &quot;Zeig mir gute Sci-Fi Filme&quot;</p>
                            </div>
                        )}
                        {messages.map(message => {
                            const text = getMessageText(message)
                            if (!text) return null
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                                            message.role === 'user'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-zinc-800 text-zinc-200'
                                        }`}
                                    >
                                        <ChatMessage content={text} role={message.role} />
                                    </div>
                                </div>
                            )
                        })}
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-800 text-zinc-400 rounded-lg px-3 py-2 text-sm">
                                    <span className="animate-pulse">Denke nach...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-3 border-t border-zinc-700 flex gap-2">
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Frag nach einem Film..."
                            className="flex-1 bg-zinc-800 text-white text-sm rounded-md px-3 py-2 border border-zinc-600 focus:outline-none focus:border-red-500 placeholder:text-zinc-500"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 cursor-pointer"
                            size="sm"
                        >
                            ↑
                        </Button>
                    </form>
                </div>
            )}
        </>
    )
}
