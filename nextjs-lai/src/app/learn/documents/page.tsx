import { Suspense } from 'react'
import { getDocuments, searchDocuments } from '@/src/actions/documents'
import { DocumentsClient } from '@/src/components/documents/DocumentsClient'
import { DocumentsLoading } from '@/src/components/documents/DocumentsLoading'

interface DocumentSummary {
    id: string
    title: string
    fileName: string | null
    fileType: string
    fileSize: number | null
    createdAt: Date
    subject?: string | null
    tags?: string[]
    summary?: string | null
    _count: { chunks: number }
}

// Serialize documents for client component
function serializeDocuments(docs: DocumentSummary[]): Array<Omit<DocumentSummary, 'createdAt'> & { createdAt: string }> {
    return docs.map(doc => ({
        ...doc,
        createdAt: doc.createdAt.toISOString(),
    }))
}

interface PageProps {
    searchParams: Promise<{ search?: string }>
}

export const dynamic = 'force-dynamic'

async function DocumentsContent({ searchParams }: PageProps) {
    const params = await searchParams
    const search = params.search ?? ''

    // Fetch documents (search or all)
    const documents = search ? await searchDocuments(search) : await getDocuments()

    // Get total count from all documents (not just search results)
    const allDocuments = search ? await getDocuments() : documents
    const totalCount = allDocuments.length

    return (
        <DocumentsClient
            documents={serializeDocuments(documents as DocumentSummary[])}
            totalCount={totalCount}
        />
    )
}

export default async function DocumentsPage(props: PageProps) {
    return (
        <Suspense fallback={<DocumentsLoading />}>
            <DocumentsContent {...props} />
        </Suspense>
    )
}
