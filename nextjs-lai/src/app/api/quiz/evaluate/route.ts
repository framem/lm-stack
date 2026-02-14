import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getModel } from '@/src/lib/llm'
import { prisma } from '@/src/lib/prisma'
import { recordAttempt } from '@/src/data-access/quiz'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { questionId, selectedIndex, freeTextAnswer } = body

        if (!questionId) {
            return NextResponse.json(
                { error: 'Frage-ID ist erforderlich.' },
                { status: 400 }
            )
        }

        // Load question from DB
        const question = await prisma.quizQuestion.findUnique({
            where: { id: questionId },
        })

        if (!question) {
            return NextResponse.json(
                { error: 'Frage nicht gefunden.' },
                { status: 404 }
            )
        }

        const questionType = question.questionType

        // Validate: mc and truefalse require selectedIndex
        if ((questionType === 'mc' || questionType === 'truefalse') &&
            (selectedIndex === undefined || selectedIndex === null)) {
            return NextResponse.json(
                { error: 'Ausgewählter Index ist für diesen Fragetyp erforderlich.' },
                { status: 400 }
            )
        }

        // Validate: freetext requires freeTextAnswer
        if (questionType === 'freetext' && !freeTextAnswer) {
            return NextResponse.json(
                { error: 'Eine Freitext-Antwort ist für diesen Fragetyp erforderlich.' },
                { status: 400 }
            )
        }

        // Sanitize free-text answer (prompt injection protection)
        const sanitizedFreeText = typeof freeTextAnswer === 'string'
            ? freeTextAnswer.slice(0, 2000)
            : undefined

        // Evaluate based on question type
        if (questionType === 'freetext') {
            return await evaluateFreetext(question, sanitizedFreeText!)
        }

        // MC or truefalse evaluation
        return await evaluateSelection(question, selectedIndex, sanitizedFreeText)
    } catch (error) {
        console.error('Quiz evaluation error:', error)
        return NextResponse.json(
            { error: 'Fehler bei der Auswertung.' },
            { status: 500 }
        )
    }
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

    if (!isCorrect) {
        const { text } = await generateText({
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
        explanation = text
    } else {
        explanation = question.explanation ?? undefined
    }

    const attempt = await recordAttempt(
        question.id, selectedIndex, isCorrect, explanation,
        sanitizedFreeText
    )

    return NextResponse.json({
        isCorrect,
        correctIndex: question.correctIndex,
        explanation,
        attemptId: attempt.id,
    })
}

// Evaluate freetext questions via LLM comparison
async function evaluateFreetext(
    question: {
        id: string
        questionText: string
        correctAnswer: string | null
        sourceSnippet: string | null
    },
    freeTextAnswer: string,
) {
    let freeTextScore = 0
    let freeTextFeedback = 'Bewertung konnte nicht verarbeitet werden.'

    const { text } = await generateText({
        model: getModel(),
        prompt: `Bewerte die folgende Freitext-Antwort eines Benutzers auf einer Skala von 0.0 bis 1.0.

Frage: ${question.questionText}
Musterantwort: ${question.correctAnswer ?? 'Keine Musterantwort verfügbar.'}
${question.sourceSnippet ? `Quelltext: "${question.sourceSnippet}"` : ''}

Antwort des Benutzers:
"${freeTextAnswer}"

Bewertungskriterien:
- 0.0: Völlig falsch oder irrelevant
- 0.5: Teilweise korrekt, wichtige Aspekte fehlen
- 1.0: Vollständig korrekt und gut begründet

Antworte ausschließlich im folgenden JSON-Format:
{"score": <0.0-1.0>, "feedback": "<kurzes konstruktives Feedback auf Deutsch>"}`,
    })

    try {
        const parsed = JSON.parse(text)
        freeTextScore = Math.max(0, Math.min(1, Number(parsed.score)))
        freeTextFeedback = String(parsed.feedback)
    } catch {
        // Fallback already set above
    }

    const isCorrect = freeTextScore >= 0.5

    const attempt = await recordAttempt(
        question.id, null, isCorrect, undefined,
        freeTextAnswer, freeTextScore, freeTextFeedback
    )

    return NextResponse.json({
        isCorrect,
        freeTextScore,
        freeTextFeedback,
        attemptId: attempt.id,
    })
}
