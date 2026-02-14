import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getModel } from '@/src/lib/llm'
import { prisma } from '@/src/lib/prisma'
import { recordAttempt } from '@/src/data-access/quiz'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { questionId, selectedIndex } = body

        if (!questionId || selectedIndex === undefined || selectedIndex === null) {
            return NextResponse.json(
                { error: 'Frage-ID und ausgewählter Index sind erforderlich.' },
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

        const options = question.options as string[]
        const isCorrect = selectedIndex === question.correctIndex
        let explanation: string | undefined

        if (!isCorrect) {
            // LLM explains why the selected answer is wrong
            const { text } = await generateText({
                model: getModel(),
                prompt: `Der Benutzer hat eine Multiple-Choice-Frage falsch beantwortet.

Frage: ${question.questionText}

Gewählte Antwort (falsch): ${options[selectedIndex]}
Korrekte Antwort: ${options[question.correctIndex]}

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

        // Save attempt to DB
        const attempt = await recordAttempt(questionId, selectedIndex, isCorrect, explanation)

        return NextResponse.json({
            isCorrect,
            correctIndex: question.correctIndex,
            explanation,
            attemptId: attempt.id,
        })
    } catch (error) {
        console.error('Quiz evaluation error:', error)
        return NextResponse.json(
            { error: 'Fehler bei der Auswertung.' },
            { status: 500 }
        )
    }
}
