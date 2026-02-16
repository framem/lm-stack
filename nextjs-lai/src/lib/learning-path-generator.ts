import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import type { LearnerProfile } from '@/src/data-access/learning-paths'

const recommendationSchema = z.object({
    nextAction: z.enum(['quiz', 'flashcards', 'review', 'read']).describe('Empfohlene nächste Aktion'),
    documentId: z.string().describe('ID des empfohlenen Dokuments'),
    reason: z.string().describe('Begründung für die Empfehlung auf Deutsch (1-2 Sätze)'),
    estimatedMinutes: z.number().describe('Geschätzte Dauer in Minuten'),
    specificChunks: z.array(z.number()).optional().describe('Abschnittsnummern zum Fokussieren'),
})

export type LearningRecommendation = z.infer<typeof recommendationSchema>

export async function generateLearningRecommendation(
    profile: LearnerProfile,
): Promise<LearningRecommendation | null> {
    if (profile.documents.length === 0) return null

    // Build a concise summary for the LLM
    const docSummaries = profile.prioritizedDocuments.slice(0, 10).map((d, i) => (
        `${i + 1}. "${d.documentTitle}" (ID: ${d.documentId})
   - Wissensstand: ${d.avgScore}% (${d.totalAttempts} Versuche)
   - Fällige Wiederholungen: ${d.dueItems}
   - Schwache Abschnitte: ${d.weakChunkCount}
   - Quizze: ${d.quizCount}, Karteikarten: ${d.flashcardCount}
   - Letzte Aktivität: ${d.lastActivityAt ? d.lastActivityAt.toISOString().split('T')[0] : 'nie'}`
    )).join('\n\n')

    const prompt = `Du bist ein Lernberater. Analysiere das folgende Lernerprofil und empfehle den optimalen nächsten Lernschritt.

Lernerprofil:
- Gesamtdokumente: ${profile.totalDocuments}
- Durchschnittlicher Wissensstand: ${profile.avgScore}%
- Aktuelle Lernstreak: ${profile.currentStreak} Tage

Dokumente (sortiert nach Dringlichkeit):
${docSummaries}

Regeln:
- Empfehle "review" wenn viele fällige Wiederholungen vorhanden sind
- Empfehle "quiz" wenn der Wissensstand eines Dokuments unter 60% liegt
- Empfehle "flashcards" wenn Karteikarten fällig sind
- Empfehle "read" wenn ein Dokument noch nie bearbeitet wurde
- Die documentId MUSS eine der oben gelisteten IDs sein
- Begründung auf Deutsch, kurz und motivierend
- Geschätzte Dauer realistisch (5-30 Minuten)`

    try {
        const { output } = await generateText({
            model: getModel(),
            system: 'Du bist ein KI-Lernberater. Gib personalisierte Lernempfehlungen basierend auf dem Fortschritt des Lernenden.',
            output: Output.object({ schema: recommendationSchema }),
            prompt,
        })

        if (!output) return null

        // Validate the documentId is one we know
        const validIds = new Set(profile.documents.map((d) => d.documentId))
        if (!validIds.has(output.documentId)) {
            // Fallback to most urgent document
            output.documentId = profile.prioritizedDocuments[0].documentId
        }

        return output
    } catch (err) {
        console.error('Failed to generate learning recommendation:', err)
        return null
    }
}
