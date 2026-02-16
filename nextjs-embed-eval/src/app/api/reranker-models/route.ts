import { NextRequest, NextResponse } from 'next/server'
import { getRerankerModels, createRerankerModel } from '@/src/data-access/reranker-models'

export async function GET() {
    const models = await getRerankerModels()
    return NextResponse.json(models)
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { name, provider, providerUrl } = body

    if (!name?.trim() || !provider?.trim() || !providerUrl?.trim()) {
        return NextResponse.json(
            { error: 'Alle Pflichtfelder müssen ausgefüllt sein.' },
            { status: 400 }
        )
    }

    const model = await createRerankerModel({
        name: name.trim(),
        provider: provider.trim(),
        providerUrl: providerUrl.trim(),
    })

    return NextResponse.json(model, { status: 201 })
}
