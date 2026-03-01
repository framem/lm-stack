import { redirect } from 'next/navigation'

interface Props {
    params: Promise<{ id: string }>
}

export default async function LanguageSetRedirectPage({ params }: Props) {
    const { id } = await params

    // Set IDs follow the pattern {code}-{level} (e.g. 'es-a1')
    const match = id.match(/^([a-z]{2})-([a-z][0-9])$/i)
    if (match) {
        redirect(`/learn/language/${match[1]}/${match[2].toLowerCase()}`)
    }

    // Fallback for unknown patterns
    redirect('/learn/language')
}
