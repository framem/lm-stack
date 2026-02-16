'use server'

import { createRerankerModel, deleteRerankerModel } from '@/src/data-access/reranker-models'
import { revalidatePath } from 'next/cache'

export async function addRerankerModel(formData: FormData) {
    const name = formData.get('name') as string
    const provider = formData.get('provider') as string
    const providerUrl = formData.get('providerUrl') as string

    if (!name?.trim() || !provider?.trim() || !providerUrl?.trim()) {
        return { error: 'Alle Pflichtfelder müssen ausgefüllt sein.' }
    }

    const model = await createRerankerModel({
        name: name.trim(),
        provider: provider.trim(),
        providerUrl: providerUrl.trim(),
    })

    revalidatePath('/rerankers')
    return { success: true, id: model.id }
}

export async function removeRerankerModel(id: string) {
    await deleteRerankerModel(id)
    revalidatePath('/rerankers')
    return { success: true }
}
