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
    generateMcQuestions,
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
    questionTypes: string[] = ['mc']
) {
    if (!documentId) {
        throw new Error('Lernmaterial-ID ist erforderlich.')
    }

    const validTypes = ['mc', 'freetext', 'truefalse']
    const types = (Array.isArray(questionTypes) ? questionTypes : ['mc'])
        .filter((t: string) => validTypes.includes(t))
    if (types.length === 0) {
        throw new Error('Mindestens ein gültiger Fragetyp ist erforderlich (mc, freetext, truefalse).')
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

    if (distribution['mc']) {
        generationTasks.push(
            generateMcQuestions(contextText, distribution['mc']).then((qs) => {
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

// Strip <think>...</think> blocks, returning reasoning and cleaned text
function extractReasoning(text: string): { reasoning: string; text: string } {
    const matches = [...text.matchAll(/<think>([\s\S]*?)<\/think>/g)]
    const reasoning = matches.map(m => m[1].trim()).filter(Boolean).join('\n\n')
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    return { reasoning, text: cleaned }
}

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
        const { text, reasoning: nativeReasoning } = await generateText({
            model: getModel(),
            prompt: `Der Benutzer hat eine Multiple-Choice-Frage falsch beantwortet.

Frage: ${question.questionText}

Gewählte Antwort (falsch): ${options[selectedIndex]}
Korrekte Antwort: ${options[question.correctIndex!]}

${question.sourceSnippet ? `Quelle: "${question.sourceSnippet}"` : ''}

Erkläre kurz und verständlich:
1. Warum die gewählte Antwort falsch ist
2. Warum die korrekte Antwort richtig ist
3. Zitiere relevante Stellen aus dem Quelltext`,
        })
        // Native reasoning (models with built-in reasoning) or <think> tag fallback
        const extracted = extractReasoning(text)
        explanation = extracted.text
        const nativeText = nativeReasoning
            ?.map((r) => r.text)
            .join('\n\n')
        reasoning = nativeText || extracted.reasoning || undefined
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

// Evaluate freetext questions via LLM comparison
const freetextEvalSchema = z.object({
    correct: z.enum(['yes', 'partly', 'no']),
    feedback: z.string(),
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
        output: Output.object({ schema: freetextEvalSchema }),
        prompt: `Prüfe ob die Antwort des Benutzers inhaltlich zur richtigen Antwort passt.

Beispiele:
Richtig: "€5,00 pro Berichtseite" | Benutzer: "5€ pro Seite" → correct: "yes" (gleicher Betrag, gleiche Bedeutung)
Richtig: "Berlin" | Benutzer: "berlin" → correct: "yes" (gleiche Stadt)
Richtig: "3 Monate" | Benutzer: "12 Wochen" → correct: "yes" (gleicher Zeitraum)
Richtig: "Die Erde kreist um die Sonne" | Benutzer: "Der Mond" → correct: "no" (falsch)
Richtig: "Vertrag läuft 2 Jahre mit 5% Rabatt" | Benutzer: "2 Jahre" → correct: "partly" (Rabatt fehlt)

Jetzt bewerte:
Richtige Antwort: "${question.correctAnswer ?? 'Unbekannt'}"
Antwort des Benutzers: "${freeTextAnswer}"

correct: "yes", "partly" oder "no"
feedback: Ein kurzer Satz auf Deutsch.`,
    })

    const scoreMap = { yes: 1.0, partly: 0.5, no: 0.0 } as const
    const freeTextScore = output ? scoreMap[output.correct] ?? 0 : 0
    const rawFeedback = output?.feedback ?? 'Bewertung konnte nicht verarbeitet werden.'
    const freeTextFeedback = extractReasoning(rawFeedback).text || rawFeedback

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
    if ((questionType === 'mc' || questionType === 'truefalse') &&
        (selectedIndex === undefined || selectedIndex === null)) {
        throw new Error('Ausgewählter Index ist für diesen Fragetyp erforderlich.')
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
