import { getSessions } from '@/src/data-access/chat'
import { getVocabularyLanguages } from '@/src/data-access/flashcards'
import { SidebarClient } from './Sidebar'

export async function AppSidebar() {
    const [sessionsRaw, languages] = await Promise.all([
        getSessions(),
        getVocabularyLanguages(),
    ])

    const sessions = sessionsRaw.map((s) => ({ id: s.id, title: s.title }))

    return <SidebarClient initialSessions={sessions} initialLanguages={languages} />
}
