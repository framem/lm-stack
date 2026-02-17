'use server'

import {
    getDocuments as fetchDocuments,
    searchDocuments as queryDocuments,
    getDocumentWithChunks,
    updateDocument as patchDocument,
    deleteDocument as removeDocument,
    getSubjects as fetchSubjects,
    hasChunksWithoutEmbeddings as checkChunksWithoutEmbeddings,
} from '@/src/data-access/documents'
import { getModel } from '@/src/lib/llm'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { revalidateDocuments } from '@/src/lib/dashboard-cache'

// List all documents with chunk counts
export async function getDocuments() {
    return fetchDocuments()
}

// Search documents by title, filename, and content (optionally filter by subject)
export async function searchDocuments(query: string, subject?: string) {
    const trimmed = query.trim()
    if (!trimmed && !subject) return fetchDocuments()
    return queryDocuments(trimmed, subject)
}

// Get all unique subjects across documents
export async function getSubjects() {
    return fetchSubjects()
}

// Get a single document with all its chunks
export async function getDocument(id: string) {
    const document = await getDocumentWithChunks(id)
    if (!document) {
        throw new Error('Lernmaterial nicht gefunden.')
    }
    return document
}

// Rename a document
export async function renameDocument(id: string, title: string) {
    const trimmed = title.trim()
    if (!trimmed) {
        throw new Error('Titel darf nicht leer sein.')
    }
    await patchDocument(id, { title: trimmed })
    revalidatePath('/learn/documents')
    revalidatePath(`/learn/documents/${id}`)
}

// Suggest a clean title for a document using LLM
export async function suggestTitle(rawTitle: string): Promise<string> {
    const trimmed = rawTitle.trim()
    if (!trimmed) throw new Error('Titel darf nicht leer sein.')

    const titleSchema = z.object({
        title: z.string().describe('Bereinigter, lesbarer Dokumenttitel ohne Dateiendungen oder Kodierungen'),
    })

    const { output } = await generateText({
        model: getModel(),
        temperature: 0,
        maxOutputTokens: 120,
        output: Output.object({ schema: titleSchema }),
        system: `Du bereinigst rohe Dokumenttitel und gibst saubere, lesbare Titel zurück.

Regeln:
- Ersetze Underscores, Bindestriche und %20 durch Leerzeichen
- Dekodiere URL-kodierte Zeichen (z.B. %C3%BC → ü, ae → ä, oe → ö, ue → ü)
- Entferne Dateiendungen (.pdf, .docx, .txt, .md)
- Entferne Präfixe wie "Copy of", "final_", "v2_", "(1)"
- Korrekte Groß-/Kleinschreibung beibehalten
- Eigennamen und Abkürzungen unverändert lassen (VW, BMW, PM)

Beispiele:
- "final_Projektbericht_VW_2024%20(1).pdf" -> "Projektbericht VW 2024"
- "meeting-notes_Q3.docx" -> "Meeting Notes Q3"
- "PM_Elli_praesentiert_ersten_intelligenten_Stromtarif" -> "PM Elli präsentiert ersten intelligenten Stromtarif"`,
        prompt: trimmed,
    })

    return output?.title || trimmed
}

// Update document metadata (subject, tags)
export async function updateDocumentMetadata(id: string, data: { subject?: string; tags?: string[] }) {
    await patchDocument(id, data)
    revalidatePath('/learn/documents')
    revalidatePath(`/learn/documents/${id}`)
}

// Delete a document and cascade to its chunks
export async function deleteDocument(id: string) {
    const document = await getDocumentWithChunks(id)
    if (!document) {
        throw new Error('Lernmaterial nicht gefunden.')
    }
    await removeDocument(id)
    revalidatePath('/learn/documents')
    revalidatePath('/learn/quiz')
    revalidateDocuments()
}

// Check if a document has chunks without embeddings
export async function hasChunksWithoutEmbeddings(documentId: string): Promise<boolean> {
    return checkChunksWithoutEmbeddings(documentId)
}
