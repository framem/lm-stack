'use server'

import { getTopicCompetencies } from '@/src/data-access/topics'
import { getDocuments } from '@/src/data-access/documents'

export async function getCompetencies(documentId?: string) {
    return getTopicCompetencies(documentId)
}

export async function getDocumentList() {
    const docs = await getDocuments()
    return docs.map((d) => ({ id: d.id, title: d.title }))
}
