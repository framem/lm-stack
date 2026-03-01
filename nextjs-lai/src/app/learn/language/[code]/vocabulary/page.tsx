import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { resolveLanguage } from '@/src/lib/language-utils'
import { VocabContent } from './vocab-content'

interface Props {
    params: Promise<{ code: string }>
}

export default async function LanguageVocabularyPage({ params }: Props) {
    const { code } = await params
    const lang = resolveLanguage(code)
    if (!lang) notFound()

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <VocabContent language={lang.name} languageCode={code} />
        </Suspense>
    )
}
