import { NextRequest, NextResponse } from 'next/server'
import { getComparisonData } from '@/src/data-access/evaluation'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'

export async function GET(request: NextRequest) {
    const modelIdsParam = request.nextUrl.searchParams.get('modelIds')

    let modelIds: string[]
    if (modelIdsParam) {
        modelIds = modelIdsParam.split(',')
    } else {
        const allModels = await getEmbeddingModels()
        modelIds = allModels.map(m => m.id)
    }

    if (modelIds.length === 0) {
        return NextResponse.json({ models: [], runs: [] })
    }

    const runs = await getComparisonData(modelIds)

    return NextResponse.json({
        runs: runs.map(run => ({
            modelId: run.modelId,
            modelName: run.model.name,
            dimensions: run.model.dimensions,
            provider: run.model.provider,
            avgSimilarity: run.avgSimilarity,
            topKAccuracy1: run.topKAccuracy1,
            topKAccuracy3: run.topKAccuracy3,
            topKAccuracy5: run.topKAccuracy5,
            mrrScore: run.mrrScore,
            createdAt: run.createdAt,
        })),
    })
}
