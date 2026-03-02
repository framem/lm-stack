import { resolveLanguage } from '@/src/lib/language-utils'
import { notFound } from 'next/navigation'
import { GrammarContent } from './grammar-content'

interface Props {
    params: Promise<{ code: string }>
}

export default async function GrammarPage({ params }: Props) {
    const { code } = await params
    const lang = resolveLanguage(code)
    if (!lang) notFound()

    return <GrammarContent language={lang} />
}
