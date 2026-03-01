import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { getDocuments } from '@/src/data-access/documents'
import { getQuizzes, getDocumentProgress } from '@/src/data-access/quiz'
import { getLearningGoals } from '@/src/data-access/learning-goal'
import { QuizContent } from './quiz-content'

async function QuizData() {
    const [docsRaw, quizzesRaw, progressRaw, goalsRaw] = await Promise.all([
        getDocuments(),
        getQuizzes(),
        getDocumentProgress(),
        getLearningGoals(),
    ])

    const documents = docsRaw.map((d) => ({
        id: d.id,
        title: d.title,
        fileType: d.fileType,
        subject: d.subject,
    }))

    const quizzes = quizzesRaw.map((q) => ({
        id: q.id,
        title: q.title,
        createdAt: q.createdAt.toISOString(),
        document: q.document,
        questions: q.questions.map((qn) => ({
            id: qn.id,
            questionType: qn.questionType,
            attempts: qn.attempts.map((a) => ({
                isCorrect: a.isCorrect,
                freeTextScore: a.freeTextScore,
                createdAt: a.createdAt.toISOString(),
            })),
        })),
    }))

    const progress = progressRaw.map((p) => ({
        documentId: p.documentId,
        documentTitle: p.documentTitle,
        totalQuestions: p.totalQuestions,
        answeredQuestions: p.answeredQuestions,
        correctScore: p.correctScore,
        percentage: p.percentage,
        lastAttemptAt: p.lastAttemptAt?.toISOString() ?? null,
    }))

    const goals = goalsRaw.map((g) => ({
        language: g.language,
        targetLevel: g.targetLevel,
    }))

    return (
        <QuizContent
            initialDocuments={documents}
            initialQuizzes={quizzes}
            initialProgress={progress}
            initialLearningGoals={goals}
        />
    )
}

export default function QuizPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <QuizData />
        </Suspense>
    )
}
