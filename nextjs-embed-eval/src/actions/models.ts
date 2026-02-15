'use server'

import { createEmbeddingModel, updateEmbeddingModel, deleteEmbeddingModel } from '@/src/data-access/embedding-models'
import { revalidatePath } from 'next/cache'

export async function addEmbeddingModel(formData: FormData) {
    const name = formData.get('name') as string
    const provider = formData.get('provider') as string
    const providerUrl = formData.get('providerUrl') as string
    const dimensions = parseInt(formData.get('dimensions') as string, 10)
    const description = formData.get('description') as string | null
    const queryPrefix = formData.get('queryPrefix') as string | null
    const documentPrefix = formData.get('documentPrefix') as string | null

    if (!name?.trim() || !provider?.trim() || !providerUrl?.trim() || isNaN(dimensions)) {
        return { error: 'Alle Pflichtfelder müssen ausgefüllt sein.' }
    }

    const model = await createEmbeddingModel({
        name: name.trim(),
        provider: provider.trim(),
        providerUrl: providerUrl.trim(),
        dimensions,
        description: description?.trim() || undefined,
        queryPrefix: queryPrefix?.trim() || undefined,
        documentPrefix: documentPrefix?.trim() || undefined,
    })

    revalidatePath('/models')
    return { success: true, id: model.id }
}

export async function editEmbeddingModel(id: string, formData: FormData) {
    const name = formData.get('name') as string
    const provider = formData.get('provider') as string
    const providerUrl = formData.get('providerUrl') as string
    const dimensions = parseInt(formData.get('dimensions') as string, 10)
    const description = formData.get('description') as string | null
    const queryPrefix = formData.get('queryPrefix') as string | null
    const documentPrefix = formData.get('documentPrefix') as string | null

    await updateEmbeddingModel(id, {
        name: name?.trim(),
        provider: provider?.trim(),
        providerUrl: providerUrl?.trim(),
        dimensions: isNaN(dimensions) ? undefined : dimensions,
        description: description?.trim() || undefined,
        queryPrefix: queryPrefix?.trim() || null,
        documentPrefix: documentPrefix?.trim() || null,
    })

    revalidatePath('/models')
    return { success: true }
}

export async function removeEmbeddingModel(id: string) {
    await deleteEmbeddingModel(id)
    revalidatePath('/models')
    return { success: true }
}
