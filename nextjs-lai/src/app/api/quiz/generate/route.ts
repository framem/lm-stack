import { NextRequest } from 'next/server'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { getFlashcardsByDocument } from '@/src/data-access/flashcards'
import { createQuiz, addQuestions } from '@/src/data-access/quiz'
import {
    selectRepresentativeChunks,
    distributeQuestions,
    generateSingleChoiceQuestions,
    generateMultipleChoiceQuestions,
    generateFreetextQuestions,
    generateTruefalseQuestions,
    generateClozeQuestions,
    generateFillInBlanksQuestions,
    generateConjugationQuestions,
    generateSentenceOrderQuestions,
    shuffle,
    type QuestionToSave,
} from '@/src/lib/quiz-generation'
import { generateVocabQuizQuestions, type VocabFlashcard } from '@/src/lib/vocab-quiz-generation'

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

        const validTypes = ['singleChoice', 'multipleChoice', 'freetext', 'truefalse', 'cloze', 'fillInBlanks', 'conjugation', 'sentenceOrder']
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

                    // Partition into language-set vs regular documents
                    const languageSetDocs = validDocs.filter(d => d.fileType === 'language-set')
                    const regularDocs = validDocs.filter(d => d.fileType !== 'language-set')

                    const allQuestions: QuestionToSave[] = []
                    let selectedChunks: { id: string; content: string; chunkIndex: number }[] = []
                    send({ type: 'progress', generated: 0, total: count })

                    // ── Vocabulary quiz path (deterministic, no LLM) ──
                    if (languageSetDocs.length > 0) {
                        const allFlashcards = (await Promise.all(
                            languageSetDocs.map(d => getFlashcardsByDocument(d.id))
                        )).flat()

                        if (allFlashcards.length >= 4) {
                            // Derive language from document subject
                            const language = languageSetDocs[0].subject ?? 'Spanisch'
                            const vocabCount = regularDocs.length > 0
                                ? Math.round(count * languageSetDocs.length / validDocs.length)
                                : count

                            const vocabCards: VocabFlashcard[] = allFlashcards.map(f => ({
                                id: f.id,
                                front: f.front,
                                back: f.back,
                                context: f.context,
                                exampleSentence: f.exampleSentence,
                                partOfSpeech: f.partOfSpeech,
                                conjugation: f.conjugation as Record<string, Record<string, string>> | null,
                            }))

                            const vocabQuestions = generateVocabQuizQuestions(vocabCards, vocabCount, types, language)
                            allQuestions.push(...vocabQuestions)
                            send({ type: 'progress', generated: allQuestions.length, total: count })
                        }
                    }

                    // ── Regular chunk-based quiz path (LLM) ──
                    if (regularDocs.length > 0) {
                        const allChunks = regularDocs.flatMap(d => d.chunks)
                        if (allChunks.length === 0 && languageSetDocs.length === 0) {
                            send({ type: 'error', message: 'Die Lernmaterialien haben keine verarbeiteten Textabschnitte.' })
                            controller.close()
                            return
                        }

                        if (allChunks.length > 0) {
                            const remainingCount = count - allQuestions.length
                            if (remainingCount > 0) {
                                selectedChunks = selectRepresentativeChunks(allChunks, remainingCount)
                                const contextText = selectedChunks.map((c) => c.content).join('\n\n---\n\n')
                                const distribution = distributeQuestions(remainingCount, types)

                                for (const type of types) {
                                    const typeCount = distribution[type] || 0
                                    if (typeCount === 0) continue

                                    if (type === 'singleChoice') {
                                        const qs = await generateSingleChoiceQuestions(contextText, typeCount)
                                        for (const q of qs) {
                                            allQuestions.push({ questionText: q.questionText, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, sourceSnippet: q.sourceSnippet, questionType: 'singleChoice' })
                                            send({ type: 'progress', generated: allQuestions.length, total: count })
                                        }
                                    } else if (type === 'multipleChoice') {
                                        const qs = await generateMultipleChoiceQuestions(contextText, typeCount)
                                        for (const q of qs) {
                                            allQuestions.push({ questionText: q.questionText, options: q.options, correctIndex: null, correctIndices: q.correctIndices, explanation: q.explanation, sourceSnippet: q.sourceSnippet, questionType: 'multipleChoice' })
                                            send({ type: 'progress', generated: allQuestions.length, total: count })
                                        }
                                    } else if (type === 'freetext') {
                                        const qs = await generateFreetextQuestions(contextText, typeCount)
                                        for (const q of qs) {
                                            allQuestions.push({ questionText: q.questionText, options: null, correctIndex: null, correctAnswer: q.correctAnswer, explanation: q.explanation, sourceSnippet: q.sourceSnippet, questionType: 'freetext' })
                                            send({ type: 'progress', generated: allQuestions.length, total: count })
                                        }
                                    } else if (type === 'truefalse') {
                                        const qs = await generateTruefalseQuestions(contextText, typeCount)
                                        for (const q of qs) {
                                            allQuestions.push({ questionText: q.questionText, options: ['Wahr', 'Falsch'], correctIndex: q.correctAnswer === 'wahr' ? 0 : 1, correctAnswer: q.correctAnswer, explanation: q.explanation, sourceSnippet: q.sourceSnippet, questionType: 'truefalse' })
                                            send({ type: 'progress', generated: allQuestions.length, total: count })
                                        }
                                    } else if (type === 'cloze') {
                                        const qs = await generateClozeQuestions(contextText, typeCount)
                                        for (const q of qs) {
                                            allQuestions.push({ questionText: q.questionText, options: null, correctIndex: null, correctAnswer: q.correctAnswer, explanation: q.explanation, sourceSnippet: q.sourceSnippet, questionType: 'cloze' })
                                            send({ type: 'progress', generated: allQuestions.length, total: count })
                                        }
                                    } else if (type === 'fillInBlanks') {
                                        const qs = await generateFillInBlanksQuestions(contextText, typeCount)
                                        for (const q of qs) {
                                            allQuestions.push({ questionText: q.questionText, options: null, correctIndex: null, correctAnswer: JSON.stringify(q.correctAnswers), explanation: q.explanation, sourceSnippet: q.sourceSnippet, questionType: 'fillInBlanks' })
                                            send({ type: 'progress', generated: allQuestions.length, total: count })
                                        }
                                    } else if (type === 'conjugation') {
                                        const qs = await generateConjugationQuestions(contextText, typeCount)
                                        for (const q of qs) {
                                            allQuestions.push({ questionText: `Konjugiere «${q.verb}» (= ${q.translation}) im ${q.tense}`, options: q.persons, correctIndex: null, correctAnswer: JSON.stringify(q.forms), explanation: q.explanation, sourceSnippet: q.sourceSnippet, questionType: 'conjugation' })
                                            send({ type: 'progress', generated: allQuestions.length, total: count })
                                        }
                                    } else if (type === 'sentenceOrder') {
                                        const qs = await generateSentenceOrderQuestions(contextText, typeCount)
                                        for (const q of qs) {
                                            const words = q.correctSentence.split(/\s+/)
                                            allQuestions.push({ questionText: 'Bringe die Wörter in die richtige Reihenfolge:', options: shuffle(words), correctIndex: null, correctAnswer: q.correctSentence, explanation: q.explanation, sourceSnippet: q.sourceSnippet, questionType: 'sentenceOrder' })
                                            send({ type: 'progress', generated: allQuestions.length, total: count })
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (allQuestions.length === 0) {
                        send({ type: 'error', message: 'Es konnten keine Quizfragen generiert werden.' })
                        controller.close()
                        return
                    }

                    // Create quiz in DB
                    const quizTitle = validDocs.length === 1
                        ? `Quiz – ${validDocs[0].title}`
                        : `Quiz – ${validDocs.length} Lernmaterialien`
                    const quiz = await createQuiz(quizTitle, documentIds[0])

                    // Save questions
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
