import { notFound } from 'next/navigation'
import { resolveLanguage } from '@/src/lib/language-utils'
import { LanguageHub } from './language-hub'
import { getVocabularyFlashcards } from '@/src/actions/flashcards'
import { getQuizzes } from '@/src/actions/quiz'
import { getCompetencies } from '@/src/app/learn/knowledge-map/actions'
import { getUserStats, getAllBadgesWithProgress } from '@/src/actions/user-stats'
import { getAdaptiveLearningData } from '@/src/actions/adaptive-learning'

interface LanguageHubPageProps {
    params: Promise<{ code: string }>
}

export default async function LanguageHubPage({ params }: LanguageHubPageProps) {
    const { code } = await params
    const lang = resolveLanguage(code)

    if (!lang) notFound()

    const [vocabCards, allQuizzes, competencies, userStats, badges, adaptiveData] =
        await Promise.all([
            getVocabularyFlashcards(undefined, lang.name),
            getQuizzes(),
            getCompetencies(),
            getUserStats(),
            getAllBadgesWithProgress(),
            getAdaptiveLearningData(code, lang.name),
        ])

    // Filter quizzes for this language
    const langQuizzes = (allQuizzes as Array<Record<string, unknown>>).filter((q) => {
        const doc = q.document as { title?: string } | null | undefined
        const title = doc?.title?.toLowerCase() ?? ''
        return title.includes(lang.name.toLowerCase())
    })

    // Filter competencies to documents belonging to this language
    const langDocIds = new Set(
        (vocabCards as Array<{ document?: { id: string } | null }>)
            .map((c) => c.document?.id)
            .filter(Boolean),
    )
    const langCompetencies = competencies.filter((c) => langDocIds.has(c.documentId))

    return (
        <LanguageHub
            code={code}
            language={lang.name}
            cards={vocabCards as never}
            quizzes={langQuizzes as never}
            competencies={langCompetencies}
            userStats={userStats as never}
            badges={badges as never}
            adaptiveData={adaptiveData}
        />
    )
}
