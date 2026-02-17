'use client'

import { useEffect, useState } from 'react'

interface Particle {
    id: number
    x: number
    color: string
    delay: number
    duration: number
    size: number
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899']

/**
 * Lightweight confetti effect using CSS animations.
 * Renders for ~2 seconds then auto-removes.
 */
export function Confetti({ active }: { active: boolean }) {
    const [particles, setParticles] = useState<Particle[]>([])

    useEffect(() => {
        if (!active) return
        const p: Particle[] = Array.from({ length: 40 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            delay: Math.random() * 0.3,
            duration: 1.2 + Math.random() * 0.8,
            size: 4 + Math.random() * 6,
        }))
        setParticles(p)
        const timer = setTimeout(() => setParticles([]), 2500)
        return () => clearTimeout(timer)
    }, [active])

    if (particles.length === 0) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
            {particles.map((p) => (
                <span
                    key={p.id}
                    className="absolute animate-confetti-fall"
                    style={{
                        left: `${p.x}%`,
                        top: '-10px',
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes confetti-fall {
                    0% {
                        transform: translateY(0) rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(${360 + Math.random() * 360}deg) scale(0.5);
                        opacity: 0;
                    }
                }
                .animate-confetti-fall {
                    animation-name: confetti-fall;
                    animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    animation-fill-mode: forwards;
                }
            `}</style>
        </div>
    )
}
