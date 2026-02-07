'use client'

import { useState, useEffect } from 'react'

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
            scrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}>
            <div className="flex items-center px-12 py-4">
                <h1 className="text-2xl font-bold text-red-600 tracking-wider">
                    MovieFlix
                </h1>
            </div>
        </nav>
    )
}
