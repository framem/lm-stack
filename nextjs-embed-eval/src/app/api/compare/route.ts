import { NextRequest, NextResponse } from 'next/server'
import { getComparisonData, getAllEvalRuns } from '@/src/data-access/evaluation'
import { getEmbeddingModels } from '@/src/data-access/embedding-models'

export async function GET(request: NextRequest) {
    const modelIdsParam = request.nextUrl.searchParams.get('modelIds')
    const showAll = request.nextUrl.searchParams.get('all') === 'true'

    let modelIds: string[]
    if (modelIdsParam) {
        modelIds = modelIdsParam.split(',')
    } else {
        const allModels = await getEmbeddingModels()
        modelIds = allModels.map(m => m.id)
    }

    if (modelIds.length === 0) {
        return NextResponse.json({ runs: [] })
    }

    // If showAll=true, return full eval history (for chunk-size comparison)
    if (showAll) {
        const allRuns = await getAllEvalRuns(modelIds)
        return NextResponse.json({
            runs: allRuns.map(run => ({
                id: run.id,
                modelId: run.modelId,
                modelName: run.model.name,
                dimensions: run.model.dimensions,
                provider: run.model.provider,
                avgSimilarity: run.avgSimilarity,
                topKAccuracy1: run.topKAccuracy1,
                topKAccuracy3: run.topKAccuracy3,
                topKAccuracy5: run.topKAccuracy5,
                mrrScore: run.mrrScore,
                ndcgScore: run.ndcgScore,
                chunkSize: run.chunkSize,
                chunkOverlap: run.chunkOverlap,
                chunkStrategy: run.chunkStrategy,
                totalChunks: run.totalChunks,
                totalPhrases: run.totalPhrases,
                createdAt: run.createdAt,
            })),
        })
    }

    // Default: latest run per model (legacy behavior)
    const runs = await getComparisonData(modelIds)

    return NextResponse.json({
        runs: runs.map(run => ({
            id: run.id,
            modelId: run.modelId,
            modelName: run.model.name,
            dimensions: run.model.dimensions,
            provider: run.model.provider,
            avgSimilarity: run.avgSimilarity,
            topKAccuracy1: run.topKAccuracy1,
            topKAccuracy3: run.topKAccuracy3,
            topKAccuracy5: run.topKAccuracy5,
            mrrScore: run.mrrScore,
            ndcgScore: run.ndcgScore,
            chunkSize: run.chunkSize,
            chunkOverlap: run.chunkOverlap,
            chunkStrategy: run.chunkStrategy,
            totalChunks: run.totalChunks,
            totalPhrases: run.totalPhrases,
            createdAt: run.createdAt,
        })),
    })
}
