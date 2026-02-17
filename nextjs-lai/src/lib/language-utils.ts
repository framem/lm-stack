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
