import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import type { Language } from '@/src/lib/conversation-scenarios'

// ── Output schema for a single generated scenario ──

const generatedScenarioSchema = z.object({
    title: z.string().describe('Titel des Szenarios auf Deutsch'),
    description: z.string().describe('Beschreibung auf Deutsch'),
    difficulty: z.string().describe('CEFR-Niveau (A1, A1-A2, A2, A2-B1, B1, B1-B2, B2)'),
    icon: z.string().describe('Ein einzelnes passendes Emoji für das Szenario'),
    systemPrompt: z.string().describe('Detaillierter System-Prompt auf Deutsch'),
    suggestions: z.array(z.string()).length(4).describe('4 Gesprächseinstiege auf Deutsch'),
})

// ── Build the language-specific system prompt section ──

const LANGUAGE_INSTRUCTIONS: Record<Language, { name: string; instruction: string }> = {
    de: {
        name: 'Deutsch',
        instruction: 'Antworte IMMER auf Deutsch. Korrigiere den Gesprächspartner NICHT, führe einfach das Gespräch natürlich weiter.',
    },
    en: {
        name: 'English',
        instruction: 'ALWAYS answer in English. Do NOT correct the conversation partner, just continue the conversation naturally.',
    },
    es: {
        name: 'Español',
        instruction: 'SIEMPRE responde en español. NO corrijas al interlocutor, solo continúa la conversación naturalmente.',
    },
}

// ── Main generation function ──

export async function generateConversationScenario(opts: {
    topic: string
    targetLanguage: Language
    difficulty: string
}) {
    const { topic, targetLanguage, difficulty } = opts

    const { output } = await generateText({
        model: getModel(),
        temperature: 0.8,
        system: `Du bist ein Experte für Sprachdidaktik und erstellst Konversationsszenarien für Sprachlerner.
Deine Aufgabe ist es, ein realistisches Alltagsszenario zu erstellen, das Sprachlerner zum Üben nutzen können.
Das Szenario muss natürlich und praxisnah sein.`,
        output: Output.object({ schema: generatedScenarioSchema }),
        prompt: `Erstelle ein Konversationsszenario zum Thema "${topic}" auf dem Sprachniveau ${difficulty}.

Anforderungen:
- title: Kurzer Titel auf Deutsch (2-4 Wörter, z.B. "Im Café", "Beim Arzt")
- description: Eine Zeile auf Deutsch, die beschreibt was der Lernende übt
- difficulty: Das CEFR-Niveau "${difficulty}"
- icon: Ein einzelnes passendes Emoji
- systemPrompt: Ein detaillierter System-Prompt auf Deutsch für den KI-Gesprächspartner. Dieser muss enthalten:
  * Rollenbeschreibung (z.B. "Du bist ein freundlicher Kellner...")
  * 5-6 konkrete Verhaltensregeln
  * Hinweis zum Sprachniveau passend zu ${difficulty}
  * Die Anweisung: "${LANGUAGE_INSTRUCTIONS[targetLanguage].instruction}"
  * Sprachniveau-Anweisung: "Verwende ${difficulty === 'A1' ? 'SEHR einfaches' : difficulty === 'A2' ? 'einfaches, klares' : difficulty === 'B1' ? 'verständliches' : 'gehobenes'} ${LANGUAGE_INSTRUCTIONS[targetLanguage].name} (${difficulty}-Niveau)."
- suggestions: 4 typische Gesprächseinstiege auf ${LANGUAGE_INSTRUCTIONS[targetLanguage].name} passend zum Szenario

Orientiere dich an diesem Beispiel-Format für den systemPrompt:
"""
Du bist ein freundlicher Kellner/eine freundliche Kellnerin in einem gemütlichen deutschen Café. Hilf dem Gast beim Bestellen.

Verhalten:
- Begrüße den Gast freundlich
- Zeige die Getränkekarte
- Beantworte einfache Fragen zu Preisen
- Frage, ob der Gast hier isst oder zum Mitnehmen möchte

Sprachniveau: Verwende SEHR einfaches Deutsch (A1-Niveau). Nur ganz kurze Sätze, alltägliche Grundwörter.
Antworte IMMER auf Deutsch. Korrigiere den Gast NICHT, führe einfach das Gespräch natürlich weiter.
"""`,
    })

    if (!output) {
        throw new Error('Szenario-Generierung fehlgeschlagen: Keine Ausgabe vom Modell erhalten.')
    }

    return output
}

export type GeneratedScenarioOutput = Awaited<ReturnType<typeof generateConversationScenario>>
