import { notFound } from 'next/navigation'
import { resolveLanguage } from '@/src/lib/language-utils'
import { ListeningExercise } from './listening-exercise'
import { prisma } from '@/src/lib/prisma'

interface ListeningPageProps {
    params: Promise<{ code: string }>
}

export default async function ListeningPage({ params }: ListeningPageProps) {
    const { code } = await params
    const lang = resolveLanguage(code)
    if (!lang) notFound()

    // Find all imported language-set documents for this language
    const documents = await prisma.document.findMany({
        where: {
            subject: lang.name,
            fileType: 'language-set',
        },
        select: { id: true, title: true },
        orderBy: { title: 'asc' },
    })

    if (documents.length === 0) notFound()

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <ListeningExercise
                languageCode={code}
                languageName={lang.name}
                documents={documents}
            />
        </div>
    )
}
