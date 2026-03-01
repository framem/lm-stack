import { LanguageHub } from './language-hub'

interface LanguageHubPageProps {
    params: Promise<{ lang: string }>
}

export default async function LanguageHubPage({ params }: LanguageHubPageProps) {
    const { lang } = await params
    const language = decodeURIComponent(lang)

    return <LanguageHub language={language} />
}
