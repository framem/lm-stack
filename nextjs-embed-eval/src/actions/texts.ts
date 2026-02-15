'use server'

import { createSourceText, deleteSourceText, deleteChunksBySourceText, getSourceTextWithChunks, updateSourceText } from '@/src/data-access/source-texts'
import { createChunks } from '@/src/data-access/source-texts'
import { chunkText, DEFAULT_TARGET_TOKENS, DEFAULT_OVERLAP_TOKENS } from '@/src/lib/chunking'
import { revalidatePath } from 'next/cache'

export async function addSourceText(formData: FormData) {
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const chunkSize = parseInt(formData.get('chunkSize') as string) || DEFAULT_TARGET_TOKENS
    const chunkOverlap = parseInt(formData.get('chunkOverlap') as string) || DEFAULT_OVERLAP_TOKENS

    if (!title?.trim() || !content?.trim()) {
        return { error: 'Titel und Inhalt sind erforderlich.' }
    }

    const sourceText = await createSourceText({
        title: title.trim(),
        content: content.trim(),
        chunkSize,
        chunkOverlap,
    })

    const chunks = chunkText(
        { text: content.trim() },
        { targetTokens: chunkSize, overlapTokens: chunkOverlap },
    )
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

export async function rechunkSourceText(id: string, chunkSize: number, chunkOverlap: number) {
    const sourceText = await getSourceTextWithChunks(id)
    if (!sourceText) return { error: 'Text nicht gefunden.' }

    await deleteChunksBySourceText(id)
    await updateSourceText(id, { chunkSize, chunkOverlap })

    const chunks = chunkText(
        { text: sourceText.content },
        { targetTokens: chunkSize, overlapTokens: chunkOverlap },
    )
    if (chunks.length > 0) {
        await createChunks(id, chunks)
    }

    revalidatePath('/texts')
    revalidatePath('/phrases')
    return { success: true, chunkCount: chunks.length }
}
