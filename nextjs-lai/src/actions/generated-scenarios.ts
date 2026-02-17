'use server'

import { revalidatePath } from 'next/cache'
import {
    createGeneratedScenario,
    getGeneratedScenarios,
    deleteGeneratedScenario,
} from '@/src/data-access/generated-scenarios'
import { generateConversationScenario } from '@/src/lib/scenario-generation'
import type { Language } from '@/src/lib/conversation-scenarios'

// ── Generate and save a new conversation scenario ──

export async function generateAndSaveScenario(params: {
    topic: string
    targetLanguage: Language
    difficulty: string
}) {
    const { topic, targetLanguage, difficulty } = params

    if (!topic.trim()) throw new Error('Thema darf nicht leer sein.')

    // Generate scenario via LLM
    const scenario = await generateConversationScenario({
        topic: topic.trim(),
        targetLanguage,
        difficulty,
    })

    // Build unique key
    const timestamp = Date.now()
    const theme = topic.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 30)
    const key = `generated-${theme || 'custom'}-${difficulty}-${targetLanguage}-${timestamp}`

    // Save to database
    const saved = await createGeneratedScenario({
        key,
        language: targetLanguage,
        difficulty: scenario.difficulty,
        icon: scenario.icon,
        title: scenario.title,
        description: scenario.description,
        systemPrompt: scenario.systemPrompt,
        suggestions: scenario.suggestions,
    })

    revalidatePath('/learn/conversation')

    return saved
}

// ── List generated scenarios ──

export async function listGeneratedScenarios(language?: string) {
    return getGeneratedScenarios({ language })
}

// ── Delete a generated scenario ──

export async function removeGeneratedScenario(id: string) {
    if (!id) throw new Error('Szenario-ID ist erforderlich.')

    await deleteGeneratedScenario(id)
    revalidatePath('/learn/conversation')
}
