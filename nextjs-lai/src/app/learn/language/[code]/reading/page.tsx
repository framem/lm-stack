import { resolveLanguage } from '@/src/lib/language-utils'
import { notFound } from 'next/navigation'
import { ReadingContent } from './reading-content'

interface Props {
    params: Promise<{ code: string }>
}

export default async function ReadingPage({ params }: Props) {
    const { code } = await params
    const lang = resolveLanguage(code)
    if (!lang) notFound()

    return <ReadingContent language={lang} />
}
