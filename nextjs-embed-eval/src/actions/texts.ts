'use server'

import { createSourceText, deleteSourceText, deleteChunksBySourceText, getSourceTextWithChunks } from '@/src/data-access/source-texts'
import { createChunks } from '@/src/data-access/source-texts'
import { chunkText } from '@/src/lib/chunking'
import { revalidatePath } from 'next/cache'

export async function addSourceText(formData: FormData) {
    const title = formData.get('title') as string
    const content = formData.get('content') as string

    if (!title?.trim() || !content?.trim()) {
        return { error: 'Titel und Inhalt sind erforderlich.' }
    }

    const sourceText = await createSourceText({ title: title.trim(), content: content.trim() })

    // Automatically chunk the text
    const chunks = chunkText({ text: content.trim() })
    if (chunks.length > 0) {
        await createChunks(sourceText.id, chunks)
    }

    revalidatePath('/texts')
    return { success: true, id: sourceText.id, chunkCount: chunks.length }
}

export async function removeSourceText(id: string) {
    await deleteSourceText(id)
    revalidatePath('/texts')
    return { success: true }
}

export async function rechunkSourceText(id: string) {
    const sourceText = await getSourceTextWithChunks(id)
    if (!sourceText) return { error: 'Text nicht gefunden.' }

    await deleteChunksBySourceText(id)
    const chunks = chunkText({ text: sourceText.content })
    if (chunks.length > 0) {
        await createChunks(id, chunks)
    }

    revalidatePath('/texts')
    return { success: true, chunkCount: chunks.length }
}
