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
