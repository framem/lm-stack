'use client'

import { ChatInterface } from '@/src/components/ChatInterface'
import type { ConversationScenario } from '@/src/lib/conversation-scenarios'

interface ConversationContentProps {
    scenario: ConversationScenario
}

export function ConversationContent({ scenario }: ConversationContentProps) {
    return (
        <div className="flex-1 min-h-0">
            <ChatInterface
                mode="conversation"
                scenario={scenario.key}
                scenarioTitle={scenario.title}
                scenarioDescription={scenario.description}
            />
        </div>
    )
}
