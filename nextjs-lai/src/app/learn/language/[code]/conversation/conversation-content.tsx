'use client'

import { ChatInterface } from '@/src/components/ChatInterface'
import type { ConversationScenario, Language } from '@/src/lib/conversation-scenarios-constants'

interface ConversationContentProps {
    scenario: ConversationScenario
    language: Language
}

export function ConversationContent({ scenario, language }: ConversationContentProps) {
    const translation = scenario.translations[language]

    return (
        <div className="flex-1 min-h-0">
            <ChatInterface
                mode="conversation"
                scenario={scenario.key}
                scenarioTitle={translation.title}
                scenarioDescription={translation.description}
                scenarioLanguage={language}
                scenarioSuggestions={translation.suggestions}
            />
        </div>
    )
}
