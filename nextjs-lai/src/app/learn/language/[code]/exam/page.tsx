import { notFound } from 'next/navigation'
import { resolveLanguage } from '@/src/lib/language-utils'
import { ExamContent } from './exam-content'

interface ExamPageProps {
    params: Promise<{ code: string }>
}

export default async function ExamPage({ params }: ExamPageProps) {
    const { code } = await params
    const lang = resolveLanguage(code)
    if (!lang) notFound()

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <ExamContent
                languageCode={code}
                languageName={lang.name}
            />
        </div>
    )
}
