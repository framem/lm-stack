'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Map } from 'lucide-react'
import { Skeleton } from '@/src/components/ui/skeleton'
import type { TopicCompetency } from '@/src/data-access/topics'
import { getCompetencies, getDocumentList } from './actions'

// Lazy load chart component — uses recharts
const KnowledgeMapChart = dynamic(
    () => import('@/src/components/KnowledgeMapChart').then((m) => m.KnowledgeMapChart),
    { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> },
)

export default function KnowledgeMapPage() {
    const [competencies, setCompetencies] = useState<TopicCompetency[]>([])
    const [documents, setDocuments] = useState<{ id: string; title: string }[]>([])
    const [selectedDocId, setSelectedDocId] = useState<string | ''>('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getDocumentList().then(setDocuments).catch(() => {})
    }, [])

    useEffect(() => {
        let cancelled = false

        const loadData = async () => {
            if (cancelled) return
            setLoading(true)

            try {
                const data = await getCompetencies(selectedDocId || undefined)
                if (!cancelled) {
                    setCompetencies(data)
                }
            } catch {
                if (!cancelled) {
                    setCompetencies([])
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadData()

        return () => {
            cancelled = true
        }
    }, [selectedDocId])

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Map className="h-6 w-6" />
                        Wissenslandkarte
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Überblick über deinen Wissensstand nach Themen.
                    </p>
                </div>

                <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="">Alle Dokumente</option>
                    {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                            {doc.title}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[400px] w-full" />
                    <div className="grid gap-3 md:grid-cols-2">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                </div>
            ) : (
                <KnowledgeMapChart competencies={competencies} />
            )}
        </div>
    )
}
