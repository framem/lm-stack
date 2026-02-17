'use client'

import { useState } from 'react'
import { OnboardingWizard } from './OnboardingWizard'

const STORAGE_KEY = 'lai_onboarding_completed'

export function OnboardingTrigger() {
    const [showOnboarding, setShowOnboarding] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_KEY) !== 'true'
        }
        return false
    })

    if (!showOnboarding) return null

    return (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
    )
}
