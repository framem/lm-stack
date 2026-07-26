import { getEmbeddingStatus } from '@/src/data-access/movies'
import AdminDashboard from '@/src/components/AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
    let status = null
    let error = null

    try {
        status = await getEmbeddingStatus()
    } catch {
        error = 'Embedding-Status konnte nicht geladen werden'
    }

    return <AdminDashboard initialStatus={status} initialError={error} />
}
