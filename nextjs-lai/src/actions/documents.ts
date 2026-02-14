'use server'

import {
    getDocuments as fetchDocuments,
    searchDocuments as queryDocuments,
    getDocumentWithChunks,
    updateDocument as patchDocument,
    deleteDocument as removeDocument,
} from '@/src/data-access/documents'
import { getModel } from '@/src/lib/llm'
import { generateText } from 'ai'
import { revalidatePath } from 'next/cache'

// List all documents with chunk counts
export async function getDocuments() {
    return fetchDocuments()
}

// Search documents by title, filename, and content
export async function searchDocuments(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return fetchDocuments()
    return queryDocuments(trimmed)
}

// Get a single document with all its chunks
export async function getDocument(id: string) {
    const document = await getDocumentWithChunks(id)
    if (!document) {
        throw new Error('Dokument nicht gefunden.')
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
    revalidatePath('/documents')
    revalidatePath(`/documents/${id}`)
}

// Strip <think>...</think> blocks that some models (e.g. Qwen3) emit
function stripThinkTags(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

// Suggest a clean title for a document using LLM
export async function suggestTitle(rawTitle: string): Promise<string> {
    const trimmed = rawTitle.trim()
    if (!trimmed) throw new Error('Titel darf nicht leer sein.')

    const { text } = await generateText({
        model: getModel(),
        temperature: 0,
        maxTokens: 120,
        system: `Du bist ein Dokumenttitel-Bereiniger. Du bekommst einen rohen Dokumenttitel (oft aus einem Dateinamen abgeleitet) und gibst einen sauberen, lesbaren Titel zurück.

Regeln:
- Ersetze Underscores (_), Bindestriche zwischen Wörtern und %20 durch Leerzeichen
- Dekodiere URL-kodierte Zeichen (z.B. %C3%BC → ü, ae → ä, oe → ö, ue → ü, ss → ß wenn sinnvoll)
- Entferne Dateiendungen (.pdf, .docx, .txt, .md)
- Entferne überflüssige Präfixe wie "Copy of", "final_", "v2_", Nummerierungen wie "(1)"
- Behalte die korrekte Groß-/Kleinschreibung der Sprache bei (Deutsch: nur Nomen und Satzanfang groß; Englisch: Title Case)
- Bekannte Eigennamen, Marken und Abkürzungen bleiben unverändert (z.B. "VW", "BMW", "PM", "Volkswagen")
- Gib NUR den bereinigten Titel zurück — keine Anführungszeichen, keine Erklärung, kein zusätzlicher Text`,
        prompt: trimmed,
    })

    const cleaned = stripThinkTags(text).replace(/^["']|["']$/g, '')
    return cleaned || trimmed
}

// Delete a document and cascade to its chunks
export async function deleteDocument(id: string) {
    const document = await getDocumentWithChunks(id)
    if (!document) {
        throw new Error('Dokument nicht gefunden.')
    }
    await removeDocument(id)
    revalidatePath('/documents')
    revalidatePath('/quiz')
}
