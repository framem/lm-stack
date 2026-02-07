'use client'

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

type ChatMessageProps = {
    content: string
    role: 'user' | 'assistant'
}

function getInternalPath(href: string): string | null {
    try {
        const url = new URL(href, 'http://localhost')
        if (url.hostname === 'localhost') return url.pathname
    } catch {}
    if (href.startsWith('/')) return href
    return null
}

const markdownComponents: Components = {
    a: ({ href, children }) => {
        const internalPath = href ? getInternalPath(href) : null
        if (internalPath) {
            return (
                <Link href={internalPath} className="text-blue-400 underline hover:text-blue-300">
                    {children}
                </Link>
            )
        }
        return (
            <a
                href={href}
                className="text-blue-400 underline hover:text-blue-300"
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </a>
        )
    },
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ children }) => <ul className="list-disc ml-4 my-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal ml-4 my-1">{children}</ol>,
    li: ({ children }) => <li className="my-0.5">{children}</li>,
    p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
}

export function ChatMessage({ content, role }: ChatMessageProps) {
    if (role === 'user') {
        return <span>{content}</span>
    }

    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {content}
        </ReactMarkdown>
    )
}
