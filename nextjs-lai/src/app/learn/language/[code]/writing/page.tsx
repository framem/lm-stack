import { resolveLanguage } from '@/src/lib/language-utils'
import { notFound } from 'next/navigation'
import { WritingContent } from './writing-content'

interface Props {
    params: Promise<{ code: string }>
}

export default async function WritingPage({ params }: Props) {
    const { code } = await params
    const lang = resolveLanguage(code)
    if (!lang) notFound()

    return <WritingContent language={lang} />
}
