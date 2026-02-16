import { NextRequest } from 'next/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getScenario } from '@/src/lib/conversation-scenarios'

const evaluationSchema = z.object({
    grammar: z.number().min(1).max(10).describe('Grammar score 1-10'),
    vocabulary: z.number().min(1).max(10).describe('Vocabulary score 1-10'),
    communication: z.number().min(1).max(10).describe('Communication effectiveness score 1-10'),
    overallFeedback: z.string().describe('Overall feedback in German, 2-4 sentences'),
    corrections: z.array(
        z.object({
            original: z.string().describe('What the learner wrote'),
            corrected: z.string().describe('Corrected version'),
            explanation: z.string().describe('Brief explanation of the error in German'),
        })
    ).describe('Specific corrections for errors found'),
})

export type ConversationEvaluation = z.infer<typeof evaluationSchema>

// POST /api/chat/conversation/evaluate - Evaluate a conversation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { messages, scenario } = body as {
            messages: { role: string; content: string }[]
            scenario: string
        }

        if (!messages || messages.length < 2) {
            return Response.json(
                { error: 'Mindestens 2 Nachrichten für eine Bewertung nötig.' },
                { status: 400 }
            )
        }

        const scenarioDef = getScenario(scenario)
        if (!scenarioDef) {
            return Response.json({ error: 'Unbekanntes Szenario.' }, { status: 400 })
        }

        const conversationText = messages
            .map((m) => `${m.role === 'user' ? 'Lernender' : 'KI-Partner'}: ${m.content}`)
            .join('\n\n')

        const { output } = await generateText({
            model: getModel(),
            output: Output.object({ schema: evaluationSchema }),
            system: `Du bist ein erfahrener Deutschlehrer, der Konversationsübungen bewertet. Bewerte die Leistung des Lernenden fair und konstruktiv.

Szenario: ${scenarioDef.title} (${scenarioDef.difficulty})
Beschreibung: ${scenarioDef.description}

Bewertungskriterien:
- Grammatik (1-10): Korrekte Satzstruktur, Konjugation, Kasus, Artikel
- Wortschatz (1-10): Vielfalt und Angemessenheit der verwendeten Wörter
- Kommunikation (1-10): Wie gut der Lernende sein Ziel erreicht hat, Natürlichkeit des Gesprächs

Gib konstruktives Feedback auf Deutsch. Sei ermutigend, aber ehrlich.
Wenn Fehler vorhanden sind, zeige die wichtigsten Korrekturen (max. 5).`,
            prompt: `Bewerte die folgende Konversationsübung:\n\n${conversationText}`,
        })

        if (output) {
            return Response.json(output)
        }

        return Response.json(
            { error: 'Bewertung konnte nicht erstellt werden.' },
            { status: 500 }
        )
    } catch (error) {
        console.error('Conversation evaluation error:', error)
        return Response.json(
            { error: 'Bewertung fehlgeschlagen.' },
            { status: 500 }
        )
    }
}
