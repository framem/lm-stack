import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'

// ── Output schemas per question type ──

export const singleChoiceQuestionSchema = z.object({
    questionText: z.string().describe('Die Quizfrage'),
    options: z.array(z.string()).length(4).describe('Genau 4 Antwortmöglichkeiten'),
    correctIndex: z.number().min(0).max(3).describe('Index der korrekten Antwort (0-3)'),
    explanation: z.string().describe('Erklärung warum die korrekte Antwort richtig ist'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext'),
})

export const freetextQuestionSchema = z.object({
    questionText: z.string().describe('Offene Frage, die eine spezifische Antwort erfordert'),
    correctAnswer: z.string().describe('Kurze, präzise Musterantwort (1-2 Sätze)'),
    explanation: z.string().describe('Erklärung warum die Musterantwort korrekt ist'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext'),
})

export const multipleChoiceQuestionSchema = z.object({
    questionText: z.string().describe('Die Quizfrage'),
    options: z.array(z.string()).min(4).max(5).describe('4-5 Antwortmöglichkeiten'),
    correctIndices: z.array(z.number()).min(2).max(4).describe('Indices der korrekten Antworten (z.B. [0, 2])'),
    explanation: z.string().describe('Erklärung warum die korrekten Antworten richtig sind'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext'),
})

export const truefalseQuestionSchema = z.object({
    questionText: z.string().describe('Eine Aussage (kein Fragesatz), die wahr oder falsch ist'),
    correctAnswer: z.enum(['wahr', 'falsch']).describe('Ob die Aussage wahr oder falsch ist'),
    explanation: z.string().describe('Erklärung warum die Aussage wahr oder falsch ist'),
    sourceSnippet: z.string().describe('Wörtliches Zitat aus dem Quelltext'),
})

// ~4 chars per token; reserve space for prompt template + output tokens
export const MAX_CONTEXT_CHARS = Number(process.env.QUIZ_MAX_CONTEXT_CHARS) || 6000

export interface QuestionToSave {
    questionText: string
    options: string[] | null
    correctIndex: number | null
    correctIndices?: number[] | null
    correctAnswer?: string
    explanation: string
    sourceSnippet: string
    questionType: string
}

// Select representative chunks distributed evenly across the document,
// respecting MAX_CONTEXT_CHARS to avoid exceeding the LLM context window.
export function selectRepresentativeChunks(
    chunks: { id: string; content: string; chunkIndex: number }[],
    count: number
) {
    const target = Math.min(chunks.length, count)

    // Try with target count, then progressively reduce if too large
    for (let n = target; n >= 1; n--) {
        const step = chunks.length / n
        const selected = []
        let totalLen = 0
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(i * step)
            selected.push(chunks[idx])
            totalLen += chunks[idx].content.length
        }
        // Account for separators between chunks
        totalLen += (n - 1) * 7 // '\n\n---\n\n'.length
        if (totalLen <= MAX_CONTEXT_CHARS) return selected
    }

    // Even a single chunk is too large — truncate its content
    const chunk = chunks[0]
    return [{ ...chunk, content: chunk.content.slice(0, MAX_CONTEXT_CHARS) }]
}

// Distribute question count across selected types as evenly as possible
export function distributeQuestions(total: number, types: string[]): Record<string, number> {
    const base = Math.floor(total / types.length)
    let remainder = total - base * types.length
    const distribution: Record<string, number> = {}
    for (const type of types) {
        distribution[type] = base + (remainder > 0 ? 1 : 0)
        if (remainder > 0) remainder--
    }
    return distribution
}

// ── LLM generation per question type ──

export async function generateSingleChoiceQuestions(contextText: string, count: number) {
    const { output } = await generateText({
        model: getModel(),
        system: 'Du erstellst Single-Choice-Quizfragen auf Deutsch basierend auf Lerntexten.',
        output: Output.array({ element: singleChoiceQuestionSchema }),
        prompt: `Erstelle genau ${count} Single-Choice-Fragen basierend auf dem folgenden Text.

Anforderungen:
- Jede Frage hat genau 4 Antwortmöglichkeiten
- Nur eine Antwort ist korrekt (correctIndex: 0, 1, 2 oder 3)
- Variiere die Position der korrekten Antwort (nicht immer Index 0)
- Die falschen Antworten sollen plausibel aber eindeutig falsch sein
- sourceSnippet: Ein wörtliches Zitat aus dem Text, das die Antwort begründet

Text:
${contextText}`,
    })
    return output ?? []
}

export async function generateFreetextQuestions(contextText: string, count: number) {
    const { output } = await generateText({
        model: getModel(),
        system: 'Du erstellst Freitext-Quizfragen auf Deutsch basierend auf Lerntexten.',
        output: Output.array({ element: freetextQuestionSchema }),
        prompt: `Erstelle genau ${count} Freitext-Fragen basierend auf dem folgenden Text.

Anforderungen:
- Offene Fragen, die spezifisches Faktenwissen abfragen (keine Ja/Nein-Fragen)
- correctAnswer: Kurze, präzise Musterantwort (möglichst ein einzelner Fakt oder kurzer Satz)
- Die Musterantwort wird für automatische Bewertung verwendet -- halte sie knapp und eindeutig
- sourceSnippet: Ein wörtliches Zitat aus dem Text

Text:
${contextText}`,
    })
    return output ?? []
}

export async function generateMultipleChoiceQuestions(contextText: string, count: number) {
    const { output } = await generateText({
        model: getModel(),
        system: 'Du erstellst Multiple-Choice-Quizfragen (mehrere richtige Antworten) auf Deutsch basierend auf Lerntexten.',
        output: Output.array({ element: multipleChoiceQuestionSchema }),
        prompt: `Erstelle genau ${count} Multiple-Choice-Fragen mit mehreren richtigen Antworten basierend auf dem folgenden Text.

Anforderungen:
- Jede Frage hat 4-5 Antwortmöglichkeiten
- Genau 2-3 Antworten sind korrekt (correctIndices: Array mit den Indices)
- Variiere die Anzahl und Position der korrekten Antworten
- Die falschen Antworten sollen plausibel aber eindeutig falsch sein
- sourceSnippet: Ein wörtliches Zitat aus dem Text, das die Antworten begründet

Text:
${contextText}`,
    })
    return output ?? []
}

export async function generateTruefalseQuestions(contextText: string, count: number) {
    const { output } = await generateText({
        model: getModel(),
        system: 'Du erstellst Wahr-oder-Falsch-Aussagen auf Deutsch basierend auf Lerntexten.',
        output: Output.array({ element: truefalseQuestionSchema }),
        prompt: `Erstelle genau ${count} Wahr-oder-Falsch-Aussagen basierend auf dem folgenden Text.

Anforderungen:
- Formuliere Aussagen (keine Fragen), die wahr oder falsch sind
- Erstelle ungefähr gleich viele wahre und falsche Aussagen
- Falsche Aussagen sollen plausibel klingen (z.B. ein Detail leicht verändern)
- sourceSnippet: Ein wörtliches Zitat aus dem Text, das die Bewertung begründet

Text:
${contextText}`,
    })
    return output ?? []
}
