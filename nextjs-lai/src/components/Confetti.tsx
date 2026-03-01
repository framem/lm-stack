'use client'

import { useEffect, useRef, useState } from 'react'

interface Particle {
    id: number
    x: number
    color: string
    delay: number
    duration: number
    size: number
    borderRadius: string
    rotation: number
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899']

function generateParticles(): Particle[] {
    return Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.3,
        duration: 1.2 + Math.random() * 0.8,
        size: 4 + Math.random() * 6,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        rotation: 360 + Math.random() * 360,
    }))
}

/**
 * Lightweight confetti effect using CSS animations.
 * Renders for ~2 seconds then auto-removes.
 */
export function Confetti({ active }: { active: boolean }) {
    const [particles, setParticles] = useState<Particle[]>([])
    const [prevActive, setPrevActive] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Generate particles during render when active transitions to true
    if (active && !prevActive) {
        setPrevActive(true)
        setParticles(generateParticles())
    }
    if (!active && prevActive) {
        setPrevActive(false)
    }

    // Auto-clear after animation completes
    useEffect(() => {
        if (particles.length === 0) return
        timerRef.current = setTimeout(() => setParticles([]), 2500)
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [particles.length > 0]) // eslint-disable-line react-hooks/exhaustive-deps

    if (particles.length === 0) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
            {particles.map((p) => (
                <span
                    key={p.id}
                    className="absolute"
                    style={{
                        left: `${p.x}%`,
                        top: '-10px',
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: p.borderRadius,
                        animation: `confetti-fall-${p.id} ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
                    }}
                />
            ))}
            <style jsx>{`
                ${particles.map((p) => `
                    @keyframes confetti-fall-${p.id} {
                        0% {
                            transform: translateY(0) rotate(0deg) scale(1);
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(100vh) rotate(${p.rotation}deg) scale(0.5);
                            opacity: 0;
                        }
                    }
                `).join('')}
            `}</style>
        </div>
    )
}
