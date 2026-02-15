import { NextResponse } from 'next/server'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'

export async function GET() {
    const models = await getEmbeddingModels()
    return NextResponse.json(models)
}
