// Shared quiz type utilities

/** Question types that use free-text input and Levenshtein/LLM scoring */
export const FREETEXT_LIKE_TYPES = new Set([
    'freetext',
    'cloze',
    'fillInBlanks',
    'conjugation',
    'sentenceOrder',
])

/** Check if a question type uses free-text scoring (Levenshtein / LLM) */
export function isFreetextLikeType(type: string | null | undefined): boolean {
    return FREETEXT_LIKE_TYPES.has(type ?? '')
}
