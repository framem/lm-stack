// ── Central Language Registry ──────────────────────────────────────────

export interface LanguageInfo {
    code: string      // ISO 639-1 (e.g. 'es')
    name: string      // German display name (e.g. 'Spanisch')
    flag: string      // Emoji flag (e.g. '🇪🇸')
    bcp47: string     // BCP-47 TTS code (e.g. 'es-ES')
}

const LANGUAGES: LanguageInfo[] = [
    { code: 'es', name: 'Spanisch',     flag: '🇪🇸', bcp47: 'es-ES' },
    { code: 'en', name: 'Englisch',     flag: '🇬🇧', bcp47: 'en-US' },
    { code: 'de', name: 'Deutsch',      flag: '🇩🇪', bcp47: 'de-DE' },
    { code: 'fr', name: 'Französisch',  flag: '🇫🇷', bcp47: 'fr-FR' },
    { code: 'it', name: 'Italienisch',  flag: '🇮🇹', bcp47: 'it-IT' },
]

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]))
const byName = new Map(LANGUAGES.map((l) => [l.name, l]))

/**
 * Resolve a language by its ISO 639-1 code
 * @returns LanguageInfo or undefined if unknown
 */
export function resolveLanguage(code: string): LanguageInfo | undefined {
    return byCode.get(code)
}

/**
 * Resolve an ISO 639-1 code from a German language name
 * @returns code like 'es' or undefined
 */
export function resolveLanguageCode(name: string): string | undefined {
    return byName.get(name)?.code
}

/**
 * Get the emoji flag for a language (by code or name)
 */
export function getLanguageFlag(codeOrName: string): string {
    return byCode.get(codeOrName)?.flag ?? byName.get(codeOrName)?.flag ?? '🌐'
}

/**
 * Get the German display name for a language code
 */
export function getLanguageName(code: string): string | undefined {
    return byCode.get(code)?.name
}

/**
 * Get BCP-47 TTS code for a language (by code or name)
 */
export function getLanguageBcp47(codeOrName: string): string {
    return byCode.get(codeOrName)?.bcp47 ?? byName.get(codeOrName)?.bcp47 ?? 'de-DE'
}

// Map conversation language codes to BCP-47 language codes for TTS
export const CONVERSATION_LANG_MAP: Record<string, string> = {
    'de': 'de-DE',
    'en': 'en-US',
    'es': 'es-ES',
}

/**
 * Get BCP-47 language code for conversation TTS
 * @param lang - Conversation language code ('de', 'en', 'es')
 * @returns BCP-47 language code (e.g., 'de-DE', 'en-US', 'es-ES')
 */
export function getConversationTTSLang(lang: 'de' | 'en' | 'es' | undefined): string {
    return (lang && CONVERSATION_LANG_MAP[lang]) || 'de-DE'
}

/**
 * Detect language from subject name for TTS
 * @param subject - Subject name (e.g., 'Spanisch', 'Englisch', 'Spanish A1')
 * @returns BCP-47 language code (e.g., 'es-ES', 'en-US', 'de-DE')
 */
export function detectLanguageFromSubject(subject?: string | null): string {
    if (!subject) return 'de-DE'

    const subjectLower = subject.toLowerCase()

    // Spanish detection
    if (subjectLower.includes('spanisch') || subjectLower.includes('spanish') || subjectLower.includes('español')) {
        return 'es-ES'
    }

    // English detection
    if (subjectLower.includes('englisch') || subjectLower.includes('english') || subjectLower.includes('inglés')) {
        return 'en-US'
    }

    // French detection
    if (subjectLower.includes('französisch') || subjectLower.includes('french') || subjectLower.includes('français')) {
        return 'fr-FR'
    }

    // Italian detection
    if (subjectLower.includes('italienisch') || subjectLower.includes('italian') || subjectLower.includes('italiano')) {
        return 'it-IT'
    }

    // Default to German
    return 'de-DE'
}

/**
 * Extract CEFR level from subject string
 * @param subject - Subject name (e.g., 'Spanisch A1', 'Englisch B2')
 * @returns CEFR level ('A1', 'A2', 'B1', 'B2', 'C1', 'C2') or null
 */
export function extractCEFRLevel(subject?: string | null): string | null {
    if (!subject) return null

    const match = subject.match(/\b([ABC][12])\b/i)
    return match ? match[1].toUpperCase() : null
}

/**
 * Compare CEFR levels (returns true if levelA >= levelB)
 * @param levelA - First CEFR level (e.g., 'B1')
 * @param levelB - Second CEFR level (e.g., 'A2')
 * @returns true if levelA is same or higher than levelB
 */
export function compareCEFRLevels(levelA: string, levelB: string): boolean {
    const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    const indexA = order.indexOf(levelA)
    const indexB = order.indexOf(levelB)

    if (indexA === -1 || indexB === -1) return false
    return indexA >= indexB
}
