/**
 * OCR orchestration via Vision-LLM.
 * Replaces the old Python Tesseract pipeline with a pure LLM approach:
 *   Stage 1 — Vision model extracts text from a page image
 *   Stage 2 — Text model cleans up OCR artefacts (optional)
 */
import { generateText } from 'ai'
import { getVisionModel, getModel } from './llm'

// ---------------------------------------------------------------------------
// Prompts (ported from Python, German, correct orthography)
// ---------------------------------------------------------------------------

const VISION_PROMPT =
    'Extrahiere bitte den gesamten Text aus diesem Bild. ' +
    'Gib nur den erkannten Text zurück, ohne zusätzliche Kommentare. ' +
    'Achte auf korrekte deutsche Rechtschreibung und Formatierung.'

const CLEANUP_SYSTEM = 'Du bist ein präziser Text-Korrektor für deutsche OCR-Texte.'

function buildCleanupPrompt(text: string, context: string): string {
    return [
        'Du bist ein Experte für die Korrektur von OCR-Fehlern in deutschen Texten.',
        '',
        'Aufgabe:',
        '1. Korrigiere Rechtschreibfehler und OCR-Fehler',
        '2. Entferne verstreuten, sinnlosen Text',
        '3. Entferne einzelne Zeichen ohne Kontext',
        '4. Behalte die Original-Formatierung (Absätze, Listen, etc.)',
        '5. Behalte alle sinnvollen Zahlen, Formeln und Fachbegriffe',
        '6. Gib nur den korrigierten Text zurück, ohne Kommentare',
        '',
        context ? `Kontext: ${context}` : '',
        '',
        'Text:',
        text,
        '',
        'Korrigierter Text:',
    ]
        .join('\n')
        .trim()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** True when a vision model is configured via VISION_MODEL env var. */
export function isOcrEnabled(): boolean {
    return !!process.env.VISION_MODEL
}

/**
 * Run OCR on a single page image using the configured vision model.
 * Returns the extracted text, or an empty string on failure.
 */
export async function performOcr(
    imageBuffer: Buffer,
    pageNumber: number,
): Promise<string> {
    const model = getVisionModel()
    if (!model) return ''

    try {
        const { text } = await generateText({
            model,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: VISION_PROMPT },
                        { type: 'image', image: imageBuffer },
                    ],
                },
            ],
            maxOutputTokens: 2000,
            temperature: 0.1,
        })

        return text.trim()
    } catch (error) {
        console.error(`OCR error on page ${pageNumber}:`, error)
        return ''
    }
}

/**
 * Optional cleanup pass — fixes OCR artefacts using the regular text model.
 * Only runs when the text is long enough to warrant it (>20 chars).
 */
export async function cleanupOcrText(
    text: string,
    context: string = '',
): Promise<string> {
    if (!text || text.trim().length <= 20) return text

    try {
        const { text: cleaned } = await generateText({
            model: getModel(),
            system: CLEANUP_SYSTEM,
            prompt: buildCleanupPrompt(text, context),
            maxOutputTokens: 4000,
            temperature: 0.2,
        })

        return cleaned.trim()
    } catch (error) {
        console.error('OCR cleanup error:', error)
        return text
    }
}
