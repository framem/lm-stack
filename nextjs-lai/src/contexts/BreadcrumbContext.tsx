'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface BreadcrumbContextType {
    currentPageTitle: string | null
    setCurrentPageTitle: (title: string | null) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [currentPageTitle, setCurrentPageTitle] = useState<string | null>(null)

    return (
        <BreadcrumbContext.Provider value={{ currentPageTitle, setCurrentPageTitle }}>
            {children}
        </BreadcrumbContext.Provider>
    )
}

export function useBreadcrumb() {
    const context = useContext(BreadcrumbContext)
    if (!context) {
        throw new Error('useBreadcrumb must be used within BreadcrumbProvider')
    }
    return context
}
