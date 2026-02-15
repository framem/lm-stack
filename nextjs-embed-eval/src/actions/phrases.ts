'use server'

import { createTestPhrase, updateTestPhrase, deleteTestPhrase } from '@/src/data-access/test-phrases'
import { revalidatePath } from 'next/cache'

export async function addTestPhrase(formData: FormData) {
    const phrase = formData.get('phrase') as string
    const expectedChunkId = formData.get('expectedChunkId') as string | null
    const category = formData.get('category') as string | null

    if (!phrase?.trim()) {
        return { error: 'Testphrase ist erforderlich.' }
    }

    const testPhrase = await createTestPhrase({
        phrase: phrase.trim(),
        expectedChunkId: expectedChunkId || undefined,
        category: category?.trim() || undefined,
    })

    revalidatePath('/phrases')
    return { success: true, id: testPhrase.id }
}

export async function editTestPhrase(id: string, formData: FormData) {
    const phrase = formData.get('phrase') as string
    const expectedChunkId = formData.get('expectedChunkId') as string | null
    const category = formData.get('category') as string | null

    await updateTestPhrase(id, {
        phrase: phrase?.trim(),
        expectedChunkId: expectedChunkId || null,
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
