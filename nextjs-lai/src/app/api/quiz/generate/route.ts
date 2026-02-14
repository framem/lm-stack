import { NextRequest } from 'next/server'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { createQuiz, addQuestions } from '@/src/data-access/quiz'
import {
    selectRepresentativeChunks,
    distributeQuestions,
    generateMcQuestions,
    generateFreetextQuestions,
    generateTruefalseQuestions,
    type QuestionToSave,
} from '@/src/lib/quiz-generation'

// POST /api/quiz/generate - Generate quiz with SSE progress
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { documentId, documentIds: rawDocumentIds, questionCount = 5, questionTypes = ['mc'] } = body

        // Support both single documentId and multiple documentIds
        const documentIds: string[] = rawDocumentIds && Array.isArray(rawDocumentIds) && rawDocumentIds.length > 0
            ? rawDocumentIds
            : documentId ? [documentId] : []

        if (documentIds.length === 0) {
            return Response.json({ error: 'Mindestens ein Lernmaterial ist erforderlich.' }, { status: 400 })
        }

        const validTypes = ['mc', 'freetext', 'truefalse']
        const types = (Array.isArray(questionTypes) ? questionTypes : ['mc'])
            .filter((t: string) => validTypes.includes(t))
        if (types.length === 0) {
            return Response.json(
                { error: 'Mindestens ein gueltiger Fragetyp ist erforderlich.' },
                { status: 400 },
            )
        }

        const count = Math.min(Math.max(Number(questionCount), 1), 20)

        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                function send(data: Record<string, unknown>) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                }

                try {
                    // Load all documents with chunks
                    const documents = await Promise.all(
                        documentIds.map(id => getDocumentWithChunks(id))
                    )
                    const validDocs = documents.filter((d): d is NonNullable<typeof d> => d !== null)
                    if (validDocs.length === 0) {
                        send({ type: 'error', message: 'Lernmaterial nicht gefunden.' })
                        controller.close()
                        return
                    }

                    const allChunks = validDocs.flatMap(d => d.chunks)
                    if (allChunks.length === 0) {
                        send({ type: 'error', message: 'Die Lernmaterialien haben keine verarbeiteten Textabschnitte.' })
                        controller.close()
                        return
                    }

                    // Select representative chunks from merged set
                    const selectedChunks = selectRepresentativeChunks(allChunks, count)
                    const contextText = selectedChunks.map((c) => c.content).join('\n\n---\n\n')

                    // Distribute questions across types
                    const distribution = distributeQuestions(count, types)

                    const allQuestions: QuestionToSave[] = []
                    let generated = 0

                    // Generate sequentially so we can report progress after each type
                    if (distribution['mc']) {
                        send({ type: 'progress', generated })
                        const qs = await generateMcQuestions(contextText, distribution['mc'])
                        for (const q of qs) {
                            allQuestions.push({
                                questionText: q.questionText,
                                options: q.options,
                                correctIndex: q.correctIndex,
                                explanation: q.explanation,
                                sourceSnippet: q.sourceSnippet,
                                questionType: 'mc',
                            })
                        }
                        generated += qs.length
                        send({ type: 'progress', generated })
                    }

                    if (distribution['freetext']) {
                        send({ type: 'progress', generated })
                        const qs = await generateFreetextQuestions(contextText, distribution['freetext'])
                        for (const q of qs) {
                            allQuestions.push({
                                questionText: q.questionText,
                                options: null,
                                correctIndex: null,
                                correctAnswer: q.correctAnswer,
                                explanation: q.explanation,
                                sourceSnippet: q.sourceSnippet,
                                questionType: 'freetext',
                            })
                        }
                        generated += qs.length
                        send({ type: 'progress', generated })
                    }

                    if (distribution['truefalse']) {
                        send({ type: 'progress', generated })
                        const qs = await generateTruefalseQuestions(contextText, distribution['truefalse'])
                        for (const q of qs) {
                            allQuestions.push({
                                questionText: q.questionText,
                                options: ['Wahr', 'Falsch'],
                                correctIndex: q.correctAnswer === 'wahr' ? 0 : 1,
                                correctAnswer: q.correctAnswer,
                                explanation: q.explanation,
                                sourceSnippet: q.sourceSnippet,
                                questionType: 'truefalse',
                            })
                        }
                        generated += qs.length
                        send({ type: 'progress', generated })
                    }

                    if (allQuestions.length === 0) {
                        send({ type: 'error', message: 'Das LLM konnte keine gueltige Antwort generieren.' })
                        controller.close()
                        return
                    }

                    // Create quiz in DB
                    const quizTitle = validDocs.length === 1
                        ? validDocs[0].title
                        : `${validDocs.length} Lernmaterialien`
                    const quiz = await createQuiz(quizTitle, documentIds[0])

                    // Save questions with correct indices
                    const questionsToSave = allQuestions.slice(0, count).map((q, i) => ({
                        questionText: q.questionText,
                        options: q.options,
                        correctIndex: q.correctIndex,
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        sourceChunkId: selectedChunks[i]?.id,
                        sourceSnippet: q.sourceSnippet,
                        questionIndex: i,
                        questionType: q.questionType,
                    }))

                    await addQuestions(quiz.id, questionsToSave)

                    send({ type: 'complete', quizId: quiz.id, generated: allQuestions.length })
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
                    console.error('Quiz generation error:', error)
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
        console.error('Quiz generation error:', error)
        return Response.json({ error: 'Quiz-Generierung fehlgeschlagen.' }, { status: 500 })
    }
}
