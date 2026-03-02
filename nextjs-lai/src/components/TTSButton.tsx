'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/src/components/ui/button'

interface TTSButtonProps {
    text: string
    lang?: string
    className?: string
    size?: 'default' | 'sm' | 'lg' | 'icon'
    autoPlay?: boolean
}

export function TTSButton({ text, lang = 'de-DE', className, size = 'icon', autoPlay }: TTSButtonProps) {
    const [speaking, setSpeaking] = useState(false)
    const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const autoPlayedRef = useRef(false)

    useEffect(() => {
        return () => {
            window.speechSynthesis?.cancel()
        }
    }, [])

    // Auto-play on mount when autoPlay is true
    useEffect(() => {
        if (!autoPlay || !supported || autoPlayedRef.current) return
        autoPlayedRef.current = true
        const timer = setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = lang
            const voices = window.speechSynthesis.getVoices()
            const match = voices.find((v) => v.lang.startsWith(lang.split('-')[0]))
            if (match) utterance.voice = match
            utterance.onend = () => setSpeaking(false)
            utterance.onerror = () => setSpeaking(false)
            utteranceRef.current = utterance
            setSpeaking(true)
            window.speechSynthesis.speak(utterance)
        }, 300)
        return () => clearTimeout(timer)
    }, [autoPlay, text, lang, supported])

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
                <VolumeX className={size === 'lg' ? 'h-8 w-8' : 'h-4 w-4'} />
            ) : (
                <Volume2 className={size === 'lg' ? 'h-8 w-8' : 'h-4 w-4'} />
            )}
        </Button>
    )
}
