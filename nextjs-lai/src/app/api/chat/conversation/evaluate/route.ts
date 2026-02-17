import { NextRequest } from 'next/server'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getScenario } from '@/src/lib/conversation-scenarios'
import { createConversationEvaluation } from '@/src/data-access/conversation-evaluation'

const evaluationSchema = z.object({
    grammar: z.number().min(1).max(10).describe('Grammar score 1-10'),
    vocabulary: z.number().min(1).max(10).describe('Vocabulary score 1-10'),
    communication: z.number().min(1).max(10).describe('Communication effectiveness score 1-10'),
    overallScore: z.number().min(1).max(10).describe('Overall performance score 1-10'),
    overallFeedback: z.string().describe('Overall feedback in German, 2-4 sentences'),
    corrections: z.array(
        z.object({
            original: z.string().describe('What the learner wrote'),
            corrected: z.string().describe('Corrected version'),
            explanation: z.string().describe('Brief explanation of the error in German'),
        })
    ).describe('Specific corrections for errors found (max 5)'),
    newVocabulary: z.array(
        z.object({
            word: z.string().describe('New or noteworthy word/phrase used by the learner'),
            translation: z.string().describe('German translation or explanation'),
        })
    ).describe('Noteworthy vocabulary the learner used or should learn (max 5)'),
    tips: z.array(z.string()).describe('2-3 concrete tips for improvement in German'),
})

export type ConversationEvaluation = z.infer<typeof evaluationSchema>

// POST /api/chat/conversation/evaluate - Evaluate a conversation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { messages, scenario, language, sessionId } = body as {
            messages: { role: string; content: string }[]
            scenario: string
            language?: string
            sessionId?: string
        }

        if (!messages || messages.length < 2) {
            return Response.json(
                { error: 'Mindestens 2 Nachrichten für eine Bewertung nötig.' },
                { status: 400 }
            )
        }

        const scenarioDef = await getScenario(scenario)
        if (!scenarioDef) {
            return Response.json({ error: 'Unbekanntes Szenario.' }, { status: 400 })
        }

        const lang = (language ?? 'de') as 'de' | 'en' | 'es'
        const t = scenarioDef.translations[lang] ?? scenarioDef.translations.de

        const conversationText = messages
            .map((m) => `${m.role === 'user' ? 'Lernender' : 'KI-Partner'}: ${m.content}`)
            .join('\n\n')

        const { output } = await generateText({
            model: getModel(),
            output: Output.object({ schema: evaluationSchema }),
            system: `Du bist ein erfahrener Sprachlehrer, der Konversationsübungen bewertet. Bewerte die Leistung des Lernenden fair und konstruktiv.

Szenario: ${t.title} (${scenarioDef.difficulty})
Beschreibung: ${t.description}
Sprache: ${lang === 'de' ? 'Deutsch' : lang === 'en' ? 'Englisch' : 'Spanisch'}

Bewertungskriterien:
- Grammatik (1-10): Korrekte Satzstruktur, Konjugation, Kasus/Genus, Artikel
- Wortschatz (1-10): Vielfalt und Angemessenheit der verwendeten Wörter für das Niveau ${scenarioDef.difficulty}
- Kommunikation (1-10): Wie gut der Lernende sein kommunikatives Ziel erreicht hat, Natürlichkeit
- Gesamtnote (1-10): Gewichteter Durchschnitt aller Kriterien

Gib konstruktives Feedback auf Deutsch:
1. overallFeedback: 2-4 Sätze Zusammenfassung
2. corrections: Die wichtigsten Grammatik-/Wortwahlfehler mit Erklärung (max 5)
3. newVocabulary: Bemerkenswerte Vokabeln, die der Lernende korrekt benutzt hat ODER die er lernen sollte (max 5)
4. tips: 2-3 konkrete, umsetzbare Tipps zur Verbesserung

Sei ermutigend, aber ehrlich. Passe die Erwartungen an das CEFR-Niveau an.`,
            prompt: `Bewerte die folgende Konversationsübung:\n\n${conversationText}`,
        })

        if (output) {
            // Save evaluation to database if sessionId is provided
            if (sessionId) {
                try {
                    await createConversationEvaluation({
                        sessionId,
                        scenarioKey: scenario,
                        language: lang,
                        grammarScore: output.grammar,
                        vocabularyScore: output.vocabulary,
                        communicationScore: output.communication,
                        corrections: output.corrections,
                        feedback: output.overallFeedback,
                    })
                } catch (dbError) {
                    console.error('Failed to save evaluation to database:', dbError)
                    // Don't fail the request if DB save fails, still return evaluation
                }
            }

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
