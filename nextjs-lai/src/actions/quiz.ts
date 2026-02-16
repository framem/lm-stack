'use server'

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { getModel } from '@/src/lib/llm'
import { getDocumentWithChunks } from '@/src/data-access/documents'
import { prisma } from '@/src/lib/prisma'
import {
    getQuizzes as dbGetQuizzes,
    getQuizWithQuestions as dbGetQuizWithQuestions,
    getQuizResults as dbGetQuizResults,
    getDocumentProgress as dbGetDocumentProgress,
    deleteQuiz as dbDeleteQuiz,
    createQuiz as dbCreateQuiz,
    addQuestions as dbAddQuestions,
    recordAttempt as dbRecordAttempt,
    upsertQuestionProgress,
    getDueQuestions as dbGetDueQuestions,
    getDueReviewCount as dbGetDueReviewCount,
} from '@/src/data-access/quiz'
import {
    selectRepresentativeChunks,
    distributeQuestions,
    generateSingleChoiceQuestions,
    generateMultipleChoiceQuestions,
    generateFreetextQuestions,
    generateTruefalseQuestions,
    type QuestionToSave,
} from '@/src/lib/quiz-generation'

// ── List all quizzes ──

export async function getQuizzes() {
    return dbGetQuizzes()
}

// ── Get quiz with sanitized questions (no correct answers) ──

export async function getQuiz(id: string) {
    const quiz = await dbGetQuizWithQuestions(id)
    if (!quiz) return null

    // Strip correctIndex/correctAnswer for cheat protection
    const sanitizedQuestions = quiz.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        questionIndex: q.questionIndex,
        questionType: q.questionType,
    }))

    return {
        id: quiz.id,
        title: quiz.title,
        document: quiz.document,
        createdAt: quiz.createdAt,
        questions: sanitizedQuestions,
    }
}

// ── Delete a quiz ──

export async function deleteQuiz(id: string) {
    const quiz = await dbGetQuizWithQuestions(id)
    if (!quiz) {
        throw new Error('Quiz nicht gefunden.')
    }
    await dbDeleteQuiz(id)
}

// ── Get quiz results ──

export async function getQuizResults(id: string) {
    return dbGetQuizResults(id)
}

// ── Knowledge progress per document ──

export async function getDocumentProgress() {
    return dbGetDocumentProgress()
}

// ── Generate quiz from document ──

export async function generateQuiz(
    documentId: string,
    questionCount: number = 5,
    questionTypes: string[] = ['singleChoice']
) {
    if (!documentId) {
        throw new Error('Lernmaterial-ID ist erforderlich.')
    }

    const validTypes = ['singleChoice', 'multipleChoice', 'freetext', 'truefalse']
    const types = (Array.isArray(questionTypes) ? questionTypes : ['singleChoice'])
        .filter((t: string) => validTypes.includes(t))
    if (types.length === 0) {
        throw new Error('Mindestens ein gültiger Fragetyp ist erforderlich (singleChoice, multi, freetext, truefalse).')
    }

    const count = Math.min(Math.max(Number(questionCount), 1), 20)

    // Load document with chunks
    const document = await getDocumentWithChunks(documentId)
    if (!document) {
        throw new Error('Lernmaterial nicht gefunden.')
    }

    if (!document.chunks || document.chunks.length === 0) {
        throw new Error('Das Lernmaterial hat keine verarbeiteten Textabschnitte.')
    }

    // Select representative chunks distributed across the document
    const selectedChunks = selectRepresentativeChunks(document.chunks, count)
    const contextText = selectedChunks.map((c) => c.content).join('\n\n---\n\n')

    // Distribute questions across types and generate in parallel
    const distribution = distributeQuestions(count, types)

    const allQuestions: QuestionToSave[] = []
    const generationTasks: Promise<void>[] = []

    if (distribution['singleChoice']) {
        generationTasks.push(
            generateSingleChoiceQuestions(contextText, distribution['singleChoice']).then((qs) => {
                for (const q of qs) {
                    allQuestions.push({
                        questionText: q.questionText,
                        options: q.options,
                        correctIndex: q.correctIndex,
                        explanation: q.explanation,
                        sourceSnippet: q.sourceSnippet,
                        questionType: 'singleChoice',
                    })
                }
            })
        )
    }

    if (distribution['multipleChoice']) {
        generationTasks.push(
            generateMultipleChoiceQuestions(contextText, distribution['multipleChoice']).then((qs) => {
                for (const q of qs) {
                    allQuestions.push({
                        questionText: q.questionText,
                        options: q.options,
                        correctIndex: null,
                        correctIndices: q.correctIndices,
                        explanation: q.explanation,
                        sourceSnippet: q.sourceSnippet,
                        questionType: 'multipleChoice',
                    })
                }
            })
        )
    }

    if (distribution['freetext']) {
        generationTasks.push(
            generateFreetextQuestions(contextText, distribution['freetext']).then((qs) => {
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
            })
        )
    }

    if (distribution['truefalse']) {
        generationTasks.push(
            generateTruefalseQuestions(contextText, distribution['truefalse']).then((qs) => {
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
            })
        )
    }

    await Promise.all(generationTasks)

    if (allQuestions.length === 0) {
        throw new Error('Das LLM konnte keine gültige Antwort generieren.')
    }

    // Create quiz in DB
    const quiz = await dbCreateQuiz(document.title, documentId)

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

    await dbAddQuestions(quiz.id, questionsToSave)

    return { quizId: quiz.id }
}

// ── Evaluate a quiz answer ──

const explanationSchema = z.object({
    explanation: z.string().describe('Erklärung warum die gewählte Antwort falsch und die korrekte richtig ist, mit Zitat aus der Quelle'),
    reasoning: z.string().optional().describe('Optionaler Denkprozess Schritt für Schritt'),
})

// Evaluate mc/truefalse questions by comparing selectedIndex to correctIndex
async function evaluateSelection(
    question: {
        id: string
        questionText: string
        options: unknown
        correctIndex: number | null
        explanation: string | null
        sourceSnippet: string | null
    },
    selectedIndex: number,
    sanitizedFreeText?: string,
) {
    const options = question.options as string[]
    const isCorrect = selectedIndex === question.correctIndex
    let explanation: string | undefined
    let reasoning: string | undefined

    if (!isCorrect) {
        const { output } = await generateText({
            model: getModel(),
            system: 'Du bist ein Lernassistent. Erkläre falsche Quizantworten kurz und verständlich auf Deutsch.',
            output: Output.object({ schema: explanationSchema }),
            prompt: `Der Benutzer hat folgende Frage falsch beantwortet.

Frage: ${question.questionText}
Gewählte Antwort (falsch): ${options[selectedIndex]}
Korrekte Antwort: ${options[question.correctIndex!]}
${question.sourceSnippet ? `\nQuelltext: "${question.sourceSnippet}"` : ''}

Schreibe in "explanation" einen kurzen Absatz, der erklärt:
- Warum die gewählte Antwort falsch ist
- Warum die korrekte Antwort richtig ist
- Zitiere relevante Stellen aus dem Quelltext`,
        })
        explanation = output?.explanation
        reasoning = output?.reasoning
    } else {
        explanation = question.explanation ?? undefined
    }

    const attempt = await dbRecordAttempt(
        question.id, selectedIndex, isCorrect, explanation,
        sanitizedFreeText
    )

    // Update spaced repetition progress
    await upsertQuestionProgress(question.id, isCorrect)

    return {
        isCorrect,
        correctIndex: question.correctIndex,
        explanation,
        reasoning,
        sourceSnippet: question.sourceSnippet ?? undefined,
        attemptId: attempt.id,
    }
}

// Evaluate multi-select questions by comparing sorted index arrays
async function evaluateMultipleChoiceSelection(
    question: {
        id: string
        questionText: string
        options: unknown
        correctIndices?: unknown
        explanation: string | null
        sourceSnippet: string | null
    },
    selectedIndices: number[],
) {
    const options = question.options as string[]
    const correctIndices = (question.correctIndices as number[] | undefined) ?? []
    const sortedSelected = [...selectedIndices].sort()
    const sortedCorrect = [...correctIndices].sort()
    const isCorrect = sortedSelected.length === sortedCorrect.length
        && sortedSelected.every((v, i) => v === sortedCorrect[i])

    let explanation: string | undefined

    if (!isCorrect) {
        const correctLabels = sortedCorrect.map(i => options[i]).join(', ')
        const selectedLabels = sortedSelected.map(i => options[i]).join(', ')
        const { output } = await generateText({
            model: getModel(),
            system: 'Du bist ein Lernassistent. Erkläre falsche Quizantworten kurz und verständlich auf Deutsch.',
            output: Output.object({ schema: explanationSchema }),
            prompt: `Der Benutzer hat folgende Frage falsch beantwortet (Multiple Choice mit mehreren richtigen Antworten).

Frage: ${question.questionText}
Gewählte Antworten (falsch): ${selectedLabels}
Korrekte Antworten: ${correctLabels}
${question.sourceSnippet ? `\nQuelltext: "${question.sourceSnippet}"` : ''}

Schreibe in "explanation" einen kurzen Absatz, der erklärt:
- Welche Auswahl falsch war und welche fehlte
- Warum die korrekten Antworten richtig sind
- Zitiere relevante Stellen aus dem Quelltext`,
        })
        explanation = output?.explanation
    } else {
        explanation = question.explanation ?? undefined
    }

    const attempt = await dbRecordAttempt(
        question.id, null, isCorrect, explanation,
        undefined, undefined, undefined, selectedIndices,
    )

    await upsertQuestionProgress(question.id, isCorrect)

    return {
        isCorrect,
        correctIndices,
        explanation,
        sourceSnippet: question.sourceSnippet ?? undefined,
        attemptId: attempt.id,
    }
}

// Evaluate freetext questions via LLM comparison
const freetextEvalSchema = z.object({
    correct: z.enum(['yes', 'partly', 'no']).describe('yes = inhaltlich korrekt, partly = teilweise korrekt, no = falsch'),
    feedback: z.string().describe('Ein kurzer Feedbacksatz auf Deutsch'),
})

async function evaluateFreetext(
    question: {
        id: string
        questionText: string
        correctAnswer: string | null
        sourceSnippet: string | null
    },
    freeTextAnswer: string,
) {
    const { output } = await generateText({
        model: getModel(),
        system: 'Du bewertest Freitext-Antworten. Vergleiche die Benutzerantwort inhaltlich (nicht wörtlich) mit der richtigen Antwort.',
        output: Output.object({ schema: freetextEvalSchema }),
        prompt: `Beispiele:
Richtig: "5,00 Euro pro Berichtseite" | Benutzer: "5 Euro pro Seite" -> correct: "yes" (gleicher Betrag)
Richtig: "Berlin" | Benutzer: "berlin" -> correct: "yes" (Groß-/Kleinschreibung egal)
Richtig: "3 Monate" | Benutzer: "12 Wochen" -> correct: "yes" (gleicher Zeitraum)
Richtig: "Die Erde kreist um die Sonne" | Benutzer: "Der Mond" -> correct: "no" (falsch)
Richtig: "Vertrag läuft 2 Jahre mit 5% Rabatt" | Benutzer: "2 Jahre" -> correct: "partly" (Rabatt fehlt)

Jetzt bewerte:
Richtige Antwort: "${question.correctAnswer ?? 'Unbekannt'}"
Antwort des Benutzers: "${freeTextAnswer}"`,
    })

    const scoreMap = { yes: 1.0, partly: 0.5, no: 0.0 } as const
    const freeTextScore = output ? scoreMap[output.correct] ?? 0 : 0
    const freeTextFeedback = output?.feedback ?? 'Bewertung konnte nicht verarbeitet werden.'

    const isCorrect = freeTextScore >= 0.5

    const attempt = await dbRecordAttempt(
        question.id, null, isCorrect, undefined,
        freeTextAnswer, freeTextScore, freeTextFeedback
    )

    // Update spaced repetition progress
    await upsertQuestionProgress(question.id, isCorrect, freeTextScore)

    return {
        isCorrect,
        freeTextScore,
        freeTextFeedback,
        sourceSnippet: question.sourceSnippet ?? undefined,
        attemptId: attempt.id,
    }
}

export async function evaluateAnswer(
    questionId: string,
    selectedIndex?: number | null,
    freeTextAnswer?: string,
    selectedIndices?: number[],
) {
    if (!questionId) {
        throw new Error('Frage-ID ist erforderlich.')
    }

    // Load question from DB
    const question = await prisma.quizQuestion.findUnique({
        where: { id: questionId },
    })

    if (!question) {
        throw new Error('Frage nicht gefunden.')
    }

    const questionType = question.questionType

    // Validate: mc and truefalse require selectedIndex
    if ((questionType === 'singleChoice' || questionType === 'truefalse') &&
        (selectedIndex === undefined || selectedIndex === null)) {
        throw new Error('Ausgewählter Index ist für diesen Fragetyp erforderlich.')
    }

    // Validate: multi requires selectedIndices
    if (questionType === 'multipleChoice' &&
        (!selectedIndices || selectedIndices.length === 0)) {
        throw new Error('Mindestens eine Auswahl ist für diesen Fragetyp erforderlich.')
    }

    // Validate: freetext requires freeTextAnswer
    if (questionType === 'freetext' && !freeTextAnswer) {
        throw new Error('Eine Freitext-Antwort ist für diesen Fragetyp erforderlich.')
    }

    // Sanitize free-text answer (prompt injection protection)
    const sanitizedFreeText = typeof freeTextAnswer === 'string'
        ? freeTextAnswer.slice(0, 2000)
        : undefined

    // Evaluate based on question type
    if (questionType === 'freetext') {
        return evaluateFreetext(question, sanitizedFreeText!)
    }

    if (questionType === 'multipleChoice') {
        return evaluateMultipleChoiceSelection(question, selectedIndices!)
    }

    // MC or truefalse evaluation
    return evaluateSelection(question, selectedIndex!, sanitizedFreeText)
}

// ── Review queue actions ──

export async function getReviewQuiz() {
    const dueQuestions = await dbGetDueQuestions(20)
    if (dueQuestions.length === 0) return null

    // Strip correct answers for cheat protection (same as getQuiz)
    const sanitized = dueQuestions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        questionIndex: q.questionIndex,
        questionType: q.questionType,
    }))

    return {
        id: 'review',
        title: 'Wiederholung',
        questions: sanitized,
    }
}

export async function getDueReviewCount() {
    return dbGetDueReviewCount()
}
