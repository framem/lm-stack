import { resolveLanguage, getLanguageFlag } from '@/src/lib/language-utils'
import { notFound } from 'next/navigation'
import { getCertificateLevelsForLanguage } from '@/src/actions/certificate'
import { getUserStats } from '@/src/actions/user-stats'
import { CertificateContent } from './certificate-content'

interface Props {
    params: Promise<{ code: string }>
    searchParams: Promise<{ level?: string }>
}

export default async function CertificatePage({ params, searchParams }: Props) {
    const { code } = await params
    const { level } = await searchParams
    const lang = resolveLanguage(code)
    if (!lang) notFound()

    const [levels, userStats] = await Promise.all([
        getCertificateLevelsForLanguage(code, lang.name),
        getUserStats(),
    ])

    return (
        <CertificateContent
            language={lang}
            levels={levels}
            userStats={userStats as { totalXp: number; currentStreak: number; longestStreak: number }}
            initialLevel={level}
        />
    )
}
