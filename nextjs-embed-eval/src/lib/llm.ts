import { generateText } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

export interface LLMConfig {
    provider: 'lmstudio' | 'ollama'
    providerUrl: string
    modelName: string
}

export interface GeneratedPhrase {
    phrase: string
    category: string
}

/**
 * Build a chat model from provider config.
 */
function getChatModel(config: LLMConfig) {
    switch (config.provider) {
        case 'lmstudio': {
            const lmstudio = createOpenAICompatible({
                name: 'lmstudio',
                baseURL: config.providerUrl || 'http://localhost:1234/v1',
            })
            return lmstudio.chatModel(config.modelName)
        }
        case 'ollama':
        default: {
            const ollama = createOllama({
                baseURL: config.providerUrl || 'http://localhost:11434',
            })
            return ollama(config.modelName)
        }
    }
}

/**
 * Generate search phrases for a given text chunk via LLM.
 * The LLM produces realistic search queries that a user would type to find
 * the information contained in the chunk.
 */
export async function generatePhrasesForChunk(
    chunkContent: string,
    sourceTitle: string,
    config: LLMConfig,
    count: number = 3
): Promise<GeneratedPhrase[]> {
    const model = getChatModel(config)

    const prompt = `Du bist ein Experte für Information Retrieval. Deine Aufgabe ist es, realistische Suchanfragen zu generieren, die ein Nutzer eingeben würde, um die folgenden Informationen zu finden.

Quellentext: "${sourceTitle}"

Textabschnitt:
---
${chunkContent}
---

Generiere genau ${count} verschiedene Suchanfragen für diesen Textabschnitt. Die Phrasen sollen vielfältig sein:
- Kurze Stichwort-Suchen (1-3 Wörter)
- Vollständige Fragen
- Umformulierte Anfragen
- Unterschiedliche Abstraktionsebenen

Ordne jeder Phrase eine Kategorie zu:
- "Faktensuche" — für konkrete Fakten, Zahlen, Namen
- "Konzeptfrage" — für Verständnisfragen zu Konzepten
- "Zusammenfassung" — für Anfragen nach Überblick/Zusammenfassung
- "Detailfrage" — für spezifische Details oder Hintergründe

Antworte NUR mit einem JSON-Array im folgenden Format, ohne weitere Erklärungen:
[{"phrase": "...", "category": "..."}, ...]`

    const { text } = await generateText({
        model,
        prompt,
        temperature: 0.7,
    })

    return parseLLMResponse(text, count)
}

/**
 * Parse the LLM response text into structured phrases.
 * Handles common LLM output quirks like markdown code blocks.
 */
function parseLLMResponse(text: string, expectedCount: number): GeneratedPhrase[] {
    // Strip markdown code fences if present
    let cleaned = text.trim()
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

    // Try to extract JSON array from response
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!arrayMatch) {
        throw new Error('LLM-Antwort enthält kein JSON-Array')
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(arrayMatch[0])
    } catch {
        throw new Error('LLM hat kein gültiges JSON erzeugt')
    }
    if (!Array.isArray(parsed)) {
        throw new Error('LLM-Antwort ist kein Array')
    }

    const validCategories = ['Faktensuche', 'Konzeptfrage', 'Zusammenfassung', 'Detailfrage']

    return parsed
        .filter((item: unknown): item is { phrase: string; category: string } => {
            if (typeof item !== 'object' || item === null) return false
            const obj = item as Record<string, unknown>
            return typeof obj.phrase === 'string' && obj.phrase.trim().length > 0
        })
        .slice(0, expectedCount)
        .map(item => ({
            phrase: item.phrase.trim(),
            category: validCategories.includes(item.category) ? item.category : 'Faktensuche',
        }))
}
