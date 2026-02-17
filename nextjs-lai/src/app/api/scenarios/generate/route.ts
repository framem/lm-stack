import { NextRequest } from 'next/server'
import { generateAndSaveScenario } from '@/src/actions/generated-scenarios'
import type { Language } from '@/src/lib/conversation-scenarios'

const VALID_LANGUAGES: Language[] = ['de', 'en', 'es']
const VALID_DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// POST /api/scenarios/generate - Generate a conversation scenario
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { language, difficulty, theme, customContext } = body

        if (!language || !VALID_LANGUAGES.includes(language)) {
            return Response.json(
                { error: `Ungültige Sprache. Erlaubt: ${VALID_LANGUAGES.join(', ')}` },
                { status: 400 },
            )
        }

        if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
            return Response.json(
                { error: `Ungültiger Schwierigkeitsgrad. Erlaubt: ${VALID_DIFFICULTIES.join(', ')}` },
                { status: 400 },
            )
        }

        // Build topic from theme and/or customContext
        const topic = customContext?.trim()
            ? `${theme ? theme + ': ' : ''}${customContext.trim()}`
            : theme || 'Alltagsgespräch'

        const scenario = await generateAndSaveScenario({
            topic,
            targetLanguage: language as Language,
            difficulty,
        })

        return Response.json({ scenario }, { status: 201 })
    } catch (error) {
        console.error('Scenario generation error:', error)
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
        return Response.json(
            { error: `Szenario-Generierung fehlgeschlagen: ${message}` },
            { status: 500 },
        )
    }
}
