// Re-export client-safe constants and types
export type { Language, ConversationScenario } from './conversation-scenarios-constants'
export { LANGUAGE_LABELS, SCENARIOS } from './conversation-scenarios-constants'

/**
 * Hybrid lookup: check hardcoded scenarios first, then the database for generated ones.
 * Generated scenarios only have one language, so all translation keys map to the same content.
 */
export async function getScenario(key: string) {
    const { SCENARIOS } = await import('./conversation-scenarios-constants')
    const { getGeneratedScenarioByKey } = await import('@/src/data-access/generated-scenarios')

    // Fast path: check hardcoded scenarios first
    const hardcoded = SCENARIOS.find((s) => s.key === key)
    if (hardcoded) return hardcoded

    // Fallback: check database for generated scenarios
    const generated = await getGeneratedScenarioByKey(key)
    if (!generated) return undefined

    // Transform single-language DB model into ConversationScenario shape
    const translation = {
        title: generated.title,
        description: generated.description,
        systemPrompt: generated.systemPrompt,
        suggestions: generated.suggestions,
    }

    return {
        key: generated.key,
        difficulty: generated.difficulty,
        icon: generated.icon,
        translations: {
            de: translation,
            en: translation,
            es: translation,
            // All languages map to the same content since generated scenarios are single-language
        },
    }
}
