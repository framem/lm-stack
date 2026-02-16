'use client'

import { useState, useEffect } from 'react'
import { OnboardingWizard } from './OnboardingWizard'

const STORAGE_KEY = 'lai_onboarding_completed'

export function OnboardingTrigger() {
    const [showOnboarding, setShowOnboarding] = useState(false)

    useEffect(() => {
        if (localStorage.getItem(STORAGE_KEY) !== 'true') {
            setShowOnboarding(true)
        }
    }, [])

    if (!showOnboarding) return null

    return (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
    )
}
