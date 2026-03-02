'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'

// ── Schema for writing evaluation feedback ──

const writingFeedbackSchema = z.object({
    grammar: z.number().min(0).max(100),
    vocabulary: z.number().min(0).max(100),
    style: z.number().min(0).max(100),
    overall: z.number().min(0).max(100),
    feedback: z.string(),
    corrections: z.array(z.object({
        original: z.string(),
        corrected: z.string(),
        explanation: z.string(),
    })),
})

export type WritingFeedback = z.infer<typeof writingFeedbackSchema>

export async function evaluateWriting(
    text: string,
    language: string,
    level: string,
): Promise<WritingFeedback> {
    const { output } = await generateText({
        model: getModel(),
        system: 'Du bist ein erfahrener Sprachlehrer und bewertest Texte von Sprachschülern.',
        output: Output.object({ schema: writingFeedbackSchema }),
        prompt: `Bewerte den folgenden Text eines Sprachschülers (Niveau: ${level}, Sprache: ${language}).

Text:
"""
${text}
"""

Bewerte den Text in diesen Kategorien (0-100):
- grammar: Grammatik — Korrektheit der Grammatik
- vocabulary: Wortschatz — Vielfalt und Angemessenheit der Wortwahl
- style: Stil — Textfluss, Kohärenz, Ausdruck
- overall: Gesamtnote — Gesamtbewertung

Gib außerdem:
- feedback: Einen kurzen, ermutigenden Kommentar mit Verbesserungsvorschlägen (auf Deutsch)
- corrections: Eine Liste konkreter Korrekturen mit original, corrected und explanation (auf Deutsch)

Passe deine Bewertung an das Niveau ${level} an — erwarte keine C1-Grammatik von A1-Schülern.`,
    })

    return output ?? {
        grammar: 0,
        vocabulary: 0,
        style: 0,
        overall: 0,
        feedback: 'Feedback konnte nicht erstellt werden.',
        corrections: [],
    }
}
