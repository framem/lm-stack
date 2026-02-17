'use client'

import { createContext, useContext } from 'react'

const LLMStatusContext = createContext(true)

export function LLMStatusProvider({
    isHealthy,
    children,
}: {
    isHealthy: boolean
    children: React.ReactNode
}) {
    return (
        <LLMStatusContext value={isHealthy}>
            {children}
        </LLMStatusContext>
    )
}

/** Returns true if the LLM server is reachable. */
export function useLLMStatus() {
    return useContext(LLMStatusContext)
}
