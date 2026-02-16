import { NextRequest } from 'next/server'
import { streamText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { selectRepresentativeChunks, detectContentType } from '@/src/lib/quiz-generation'
import { createFlashcards as dbCreateFlashcards } from '@/src/data-access/flashcards'

const flashcardElementSchema = z.object({
    front: z.string().describe('Kurze Frage, Begriff oder Konzept'),
    back: z.string().describe('Antwort, Definition oder Erklärung'),
    context: z.string().optional().describe('Optionales Zitat aus dem Quelltext'),
    sourceSection: z.number().describe('Abschnittsnummer (1-basiert)'),
})

const vocabFlashcardElementSchema = z.object({
    front: z.string().describe('Das Wort, die Phrase oder der Begriff'),
    back: z.string().describe('Die Übersetzung, Definition oder Erklärung'),
    context: z.string().optional().describe('Optionales Zitat aus dem Quelltext'),
    sourceSection: z.number().describe('Abschnittsnummer (1-basiert)'),
    exampleSentence: z.string().optional().describe('Ein Beispielsatz mit dem Wort'),
    partOfSpeech: z.string().optional().describe('Wortart: Verb, Nomen, Adjektiv, Adverb, etc.'),
    conjugation: z.object({
        present: z.record(z.string(), z.string()).optional(),
        past: z.record(z.string(), z.string()).optional(),
        perfect: z.record(z.string(), z.string()).optional(),
    }).optional().describe('Konjugationstabelle, nur bei Verben'),
})

// POST /api/flashcards/generate - Generate flashcards with SSE progress
export async function POST(request: NextRequest) {
    try {
        const { documentId, count: rawCount = 10 } = await request.json()

        if (!documentId) {
            return Response.json({ error: 'Lernmaterial-ID ist erforderlich.' }, { status: 400 })
        }

        const document = await getDocumentWithChunks(documentId)
        if (!document) {
            return Response.json({ error: 'Lernmaterial nicht gefunden.' }, { status: 400 })
        }
        if (!document.chunks || document.chunks.length === 0) {
            return Response.json(
                { error: 'Das Lernmaterial hat keine verarbeiteten Textabschnitte.' },
                { status: 400 },
            )
        }

        const count = Math.min(Math.max(rawCount, 1), 30)
        const selectedChunks = selectRepresentativeChunks(document.chunks, count)

        const contextText = selectedChunks
            .map((c, i) => `[Abschnitt ${i + 1}]\n${c.content}`)
            .join('\n\n---\n\n')

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                function send(data: Record<string, unknown>) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                }

                try {
                    send({ type: 'progress', generated: 0, total: count })

                    const contentType = detectContentType(contextText)

                    const isVocab = contentType === 'vocabulary'
                    const systemPrompt = isVocab
                        ? 'Du erstellst Vokabel-Karteikarten. Erstelle pro Wort oder Phrase genau eine Karteikarte. Gib wenn möglich einen Beispielsatz und die Wortart an. Falls das Wort ein Verb ist, gib die Konjugation an.'
                        : 'Du erstellst Karteikarten auf Deutsch basierend auf Lerntexten.'
                    const userPrompt = isVocab
                        ? `Der folgende Text ist eine Vokabelliste. Erstelle pro Eintrag (Wort, Phrase oder Begriff) genau eine Karteikarte.

Anforderungen:
- front: Das Wort, die Phrase oder der Begriff
- back: Die Übersetzung, Definition oder Erklärung
- exampleSentence: Ein Beispielsatz, der das Wort verwendet (optional)
- partOfSpeech: Wortart (Verb, Nomen, Adjektiv, etc.) (optional)
- conjugation: Falls das Wort ein Verb ist, gib die Konjugation an (Präsens, Präteritum, Perfekt) mit den Pronomen ich/du/er/wir/ihr/sie. Bei Nicht-Verben weglassen.
- sourceSection: Abschnittsnummer (1 bis ${selectedChunks.length})
- Ignoriere Leerzeilen und Überschriften

Text:
${contextText}`
                        : `Erstelle genau ${count} Karteikarten aus dem folgenden Text (${selectedChunks.length} Abschnitte).

Anforderungen:
- front: Kurze Frage oder Begriff (max. 1 Satz)
- back: Präzise Antwort oder Erklärung
- sourceSection: Abschnittsnummer (1 bis ${selectedChunks.length})
- Gleichmäßig über alle Abschnitte verteilen

Fokus: Definitionen, Kernkonzepte, Fakten (Zahlen, Daten, Namen), Praxiswissen

Text:
${contextText}`

                    const elementSchema = isVocab ? vocabFlashcardElementSchema : flashcardElementSchema
                    const result = streamText({
                        model: getModel(),
                        system: systemPrompt,
                        output: Output.array({ element: elementSchema }),
                        prompt: userPrompt,
                    })

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const cards: any[] = []

                    for await (const element of result.elementStream) {
                        cards.push(element)
                        send({ type: 'progress', generated: cards.length, total: count })
                    }

                    if (cards.length === 0) {
                        send({ type: 'error', message: 'Das LLM konnte keine gültigen Karteikarten generieren.' })
                        controller.close()
                        return
                    }

                    // Save to DB
                    const dataToSave = cards.slice(0, count).map((card) => {
                        const idx = Math.max(
                            0,
                            Math.min((card.sourceSection || 1) - 1, selectedChunks.length - 1),
                        )
                        return {
                            documentId,
                            front: card.front,
                            back: card.back,
                            context: card.context || undefined,
                            chunkId: selectedChunks[idx].id,
                            ...(isVocab ? {
                                isVocabulary: true,
                                exampleSentence: card.exampleSentence || undefined,
                                partOfSpeech: card.partOfSpeech || undefined,
                                conjugation: card.conjugation || undefined,
                            } : {}),
                        }
                    })

                    await dbCreateFlashcards(dataToSave)
                    send({ type: 'complete', generated: dataToSave.length })
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
                    console.error('Flashcard generation error:', error)
                    send({ type: 'error', message })
                } finally {
                    controller.close()
                }
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        })
    } catch (error) {
        console.error('Flashcard generation error:', error)
        return Response.json({ error: 'Karteikarten-Generierung fehlgeschlagen.' }, { status: 500 })
    }
}
