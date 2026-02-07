'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import SearchBar from './SearchBar'

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const isHome = pathname === '/'

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
            scrolled ? 'bg-[#141414]' : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}>
            <div className="flex items-center justify-between px-12 py-4">
                {isHome ? (
                    <h1 className="text-2xl font-bold text-red-600 tracking-wider">
                        MovieFlix
                    </h1>
                ) : (
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Back</span>
                    </button>
                )}
                <SearchBar />
            </div>
        </nav>
    )
}
