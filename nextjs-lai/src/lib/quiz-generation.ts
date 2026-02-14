import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'

// ── Output schemas per question type ──

export const mcQuestionSchema = z.object({
    questionText: z.string(),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().min(0).max(3),
    explanation: z.string(),
    sourceSnippet: z.string(),
})

export const freetextQuestionSchema = z.object({
    questionText: z.string(),
    correctAnswer: z.string(),
    explanation: z.string(),
    sourceSnippet: z.string(),
})

export const truefalseQuestionSchema = z.object({
    questionText: z.string(),
    correctAnswer: z.enum(['wahr', 'falsch']),
    explanation: z.string(),
    sourceSnippet: z.string(),
})

// ~4 chars per token; reserve space for prompt template + output tokens
export const MAX_CONTEXT_CHARS = Number(process.env.QUIZ_MAX_CONTEXT_CHARS) || 6000

export interface QuestionToSave {
    questionText: string
    options: string[] | null
    correctIndex: number | null
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

export async function generateMcQuestions(contextText: string, count: number) {
    const schema = z.object({ questions: z.array(mcQuestionSchema) })
    const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema }),
        prompt: `Erstelle genau ${count} Multiple-Choice-Fragen basierend auf dem folgenden Text.
Jede Frage soll:
- Genau 4 Antwortmöglichkeiten haben
- Eine korrekte Antwort haben (correctIndex: 0-3)
- Eine Erklärung enthalten, warum die korrekte Antwort richtig ist
- Ein Zitat aus dem Quelltext enthalten (sourceSnippet)

Antworte ausschließlich mit gültigem JSON.

Text:
${contextText}`,
    })
    return output?.questions ?? []
}

export async function generateFreetextQuestions(contextText: string, count: number) {
    const schema = z.object({ questions: z.array(freetextQuestionSchema) })
    const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema }),
        prompt: `Erstelle genau ${count} Freitext-Fragen basierend auf dem folgenden Text.
Jede Frage soll:
- Eine offene Frage sein, die der Benutzer in eigenen Worten beantworten muss
- Eine Musterantwort haben (correctAnswer), die als Bewertungsgrundlage dient
- Eine Erklärung enthalten, warum die Musterantwort korrekt ist
- Ein Zitat aus dem Quelltext enthalten (sourceSnippet)

Antworte ausschließlich mit gültigem JSON.

Text:
${contextText}`,
    })
    return output?.questions ?? []
}

export async function generateTruefalseQuestions(contextText: string, count: number) {
    const schema = z.object({ questions: z.array(truefalseQuestionSchema) })
    const { output } = await generateText({
        model: getModel(),
        output: Output.object({ schema }),
        prompt: `Erstelle genau ${count} Wahr-oder-Falsch-Fragen basierend auf dem folgenden Text.
Jede Frage soll:
- Eine Aussage sein, die entweder wahr oder falsch ist
- correctAnswer: "wahr" oder "falsch"
- Eine Erklärung enthalten, warum die Aussage wahr oder falsch ist
- Ein Zitat aus dem Quelltext enthalten (sourceSnippet)

Antworte ausschließlich mit gültigem JSON.

Text:
${contextText}`,
    })
    return output?.questions ?? []
}
