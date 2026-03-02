import { resolveLanguage } from '@/src/lib/language-utils'
import { notFound } from 'next/navigation'
import { PronunciationContent } from './pronunciation-content'

interface Props {
    params: Promise<{ code: string }>
}

export default async function PronunciationPage({ params }: Props) {
    const { code } = await params
    const lang = resolveLanguage(code)
    if (!lang) notFound()

    return <PronunciationContent language={lang} />
}
