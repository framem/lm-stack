'use server'

import { createTestPhrase, updateTestPhrase, deleteTestPhrase } from '@/src/data-access/test-phrases'
import { revalidatePath } from 'next/cache'

export async function addTestPhrase(formData: FormData) {
    const phrase = formData.get('phrase') as string
    const rawExpectedChunkId = formData.get('expectedChunkId') as string | null
    const expectedChunkId = rawExpectedChunkId && rawExpectedChunkId !== 'none' ? rawExpectedChunkId : undefined
    const category = formData.get('category') as string | null
    const sourceTextId = formData.get('sourceTextId') as string | null
    const expectedContent = formData.get('expectedContent') as string | null

    if (!phrase?.trim()) {
        return { error: 'Suchphrase ist erforderlich.' }
    }

    const testPhrase = await createTestPhrase({
        phrase: phrase.trim(),
        expectedChunkId,
        sourceTextId: sourceTextId || undefined,
        expectedContent: expectedContent || undefined,
        category: category?.trim() || undefined,
    })

    revalidatePath('/phrases')
    return { success: true, id: testPhrase.id }
}

export async function editTestPhrase(id: string, formData: FormData) {
    const phrase = formData.get('phrase') as string
    const rawExpectedChunkId = formData.get('expectedChunkId') as string | null
    const expectedChunkId = rawExpectedChunkId && rawExpectedChunkId !== 'none' ? rawExpectedChunkId : null
    const category = formData.get('category') as string | null
    const sourceTextId = formData.get('sourceTextId') as string | null
    const expectedContent = formData.get('expectedContent') as string | null

    await updateTestPhrase(id, {
        phrase: phrase?.trim(),
        expectedChunkId,
        sourceTextId: sourceTextId || null,
        expectedContent: expectedContent || null,
        category: category?.trim() || null,
    })

    revalidatePath('/phrases')
    return { success: true }
}

export async function removeTestPhrase(id: string) {
    await deleteTestPhrase(id)
    revalidatePath('/phrases')
    return { success: true }
}
