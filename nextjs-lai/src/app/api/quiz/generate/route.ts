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
        const { documentId, questionCount = 5, questionTypes = ['mc'] } = body

        if (!documentId) {
            return Response.json({ error: 'Dokument-ID ist erforderlich.' }, { status: 400 })
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
                    // Load document with chunks
                    const document = await getDocumentWithChunks(documentId)
                    if (!document) {
                        send({ type: 'error', message: 'Dokument nicht gefunden.' })
                        controller.close()
                        return
                    }

                    if (!document.chunks || document.chunks.length === 0) {
                        send({ type: 'error', message: 'Das Dokument hat keine verarbeiteten Textabschnitte.' })
                        controller.close()
                        return
                    }

                    // Select representative chunks
                    const selectedChunks = selectRepresentativeChunks(document.chunks, count)
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
                    const quiz = await createQuiz(document.title, documentId)

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
