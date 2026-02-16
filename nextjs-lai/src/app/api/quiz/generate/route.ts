import { NextRequest } from 'next/server'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { createQuiz, addQuestions } from '@/src/data-access/quiz'
import {
    selectRepresentativeChunks,
    distributeQuestions,
    generateSingleChoiceQuestions,
    generateMultipleChoiceQuestions,
    generateFreetextQuestions,
    generateTruefalseQuestions,
    type QuestionToSave,
} from '@/src/lib/quiz-generation'

// POST /api/quiz/generate - Generate quiz with SSE progress
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { documentId, documentIds: rawDocumentIds, questionCount = 5, questionTypes = ['singleChoice'] } = body

        // Support both single documentId and multiple documentIds
        const documentIds: string[] = rawDocumentIds && Array.isArray(rawDocumentIds) && rawDocumentIds.length > 0
            ? rawDocumentIds
            : documentId ? [documentId] : []

        if (documentIds.length === 0) {
            return Response.json({ error: 'Mindestens ein Lernmaterial ist erforderlich.' }, { status: 400 })
        }

        const validTypes = ['singleChoice', 'multipleChoice', 'freetext', 'truefalse']
        const types = (Array.isArray(questionTypes) ? questionTypes : ['singleChoice'])
            .filter((t: string) => validTypes.includes(t))
        if (types.length === 0) {
            return Response.json(
                { error: 'Mindestens ein gültiger Fragetyp ist erforderlich.' },
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

                    // Build flat generation queue for per-question progress
                    const queue: string[] = []
                    for (const type of types) {
                        for (let i = 0; i < (distribution[type] || 0); i++) {
                            queue.push(type)
                        }
                    }

                    const allQuestions: QuestionToSave[] = []
                    send({ type: 'progress', generated: 0, total: count })

                    for (const type of queue) {
                        let question: QuestionToSave | null = null

                        if (type === 'singleChoice') {
                            const qs = await generateSingleChoiceQuestions(contextText, 1)
                            if (qs[0]) {
                                const q = qs[0]
                                question = {
                                    questionText: q.questionText,
                                    options: q.options,
                                    correctIndex: q.correctIndex,
                                    explanation: q.explanation,
                                    sourceSnippet: q.sourceSnippet,
                                    questionType: 'singleChoice',
                                }
                            }
                        } else if (type === 'multipleChoice') {
                            const qs = await generateMultipleChoiceQuestions(contextText, 1)
                            if (qs[0]) {
                                const q = qs[0]
                                question = {
                                    questionText: q.questionText,
                                    options: q.options,
                                    correctIndex: null,
                                    correctIndices: q.correctIndices,
                                    explanation: q.explanation,
                                    sourceSnippet: q.sourceSnippet,
                                    questionType: 'multipleChoice',
                                }
                            }
                        } else if (type === 'freetext') {
                            const qs = await generateFreetextQuestions(contextText, 1)
                            if (qs[0]) {
                                const q = qs[0]
                                question = {
                                    questionText: q.questionText,
                                    options: null,
                                    correctIndex: null,
                                    correctAnswer: q.correctAnswer,
                                    explanation: q.explanation,
                                    sourceSnippet: q.sourceSnippet,
                                    questionType: 'freetext',
                                }
                            }
                        } else if (type === 'truefalse') {
                            const qs = await generateTruefalseQuestions(contextText, 1)
                            if (qs[0]) {
                                const q = qs[0]
                                question = {
                                    questionText: q.questionText,
                                    options: ['Wahr', 'Falsch'],
                                    correctIndex: q.correctAnswer === 'wahr' ? 0 : 1,
                                    correctAnswer: q.correctAnswer,
                                    explanation: q.explanation,
                                    sourceSnippet: q.sourceSnippet,
                                    questionType: 'truefalse',
                                }
                            }
                        }

                        if (question) allQuestions.push(question)
                        send({ type: 'progress', generated: allQuestions.length, total: count })
                    }

                    if (allQuestions.length === 0) {
                        send({ type: 'error', message: 'Das LLM konnte keine gültige Antwort generieren.' })
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
                        correctIndices: q.correctIndices,
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
