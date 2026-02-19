'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/src/components/ui/button'

interface TTSButtonProps {
    text: string
    lang?: string
    className?: string
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function TTSButton({ text, lang = 'de-DE', className, size = 'icon' }: TTSButtonProps) {
    const [speaking, setSpeaking] = useState(false)
    const [supported, setSupported] = useState(false)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

    useEffect(() => {
        setSupported('speechSynthesis' in window)
        return () => {
            window.speechSynthesis?.cancel()
        }
    }, [])

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        if (!supported) return

        if (speaking) {
            window.speechSynthesis.cancel()
            setSpeaking(false)
            return
        }

        // Cancel any ongoing speech first
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang

        // Try to find a matching voice
        const voices = window.speechSynthesis.getVoices()
        const match = voices.find((v) => v.lang.startsWith(lang.split('-')[0]))
        if (match) utterance.voice = match

        utterance.onend = () => setSpeaking(false)
        utterance.onerror = () => setSpeaking(false)

        utteranceRef.current = utterance
        setSpeaking(true)
        window.speechSynthesis.speak(utterance)
    }, [text, lang, speaking, supported])

    if (!supported) return null

    return (
        <Button
            variant="ghost"
            size={size}
            className={className}
            onClick={handleClick}
            aria-label={speaking ? 'Vorlesen stoppen' : 'Vorlesen'}
        >
            {speaking ? (
                <VolumeX className="h-4 w-4" />
            ) : (
                <Volume2 className="h-4 w-4" />
            )}
        </Button>
    )
}
