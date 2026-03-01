import { LanguageHub } from './language-hub'
import { getSubjectDocCount } from '@/src/data-access/subjects'

interface LanguageHubPageProps {
    params: Promise<{ lang: string }>
}

export default async function LanguageHubPage({ params }: LanguageHubPageProps) {
    const { lang } = await params
    const language = decodeURIComponent(lang)
    const subjectDocCount = await getSubjectDocCount(language)

    return <LanguageHub language={language} subjectDocCount={subjectDocCount} />
}
