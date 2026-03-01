import { notFound } from 'next/navigation'
import { resolveLanguage } from '@/src/lib/language-utils'
import { LanguageHub } from './language-hub'

interface LanguageHubPageProps {
    params: Promise<{ code: string }>
}

export default async function LanguageHubPage({ params }: LanguageHubPageProps) {
    const { code } = await params
    const lang = resolveLanguage(code)

    if (!lang) notFound()

    return <LanguageHub code={code} language={lang.name} />
}
