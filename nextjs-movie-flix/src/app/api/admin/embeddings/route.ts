import {
    getEmbeddingStatus,
    getMoviesWithoutEmbedding,
    saveMovieEmbedding,
    buildEmbeddingText,
} from '@/src/data-access/movies'
import { createEmbedding } from '@/src/lib/llm'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
    try {
        const status = await getEmbeddingStatus()
        return Response.json(status)
    } catch (error) {
        return Response.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch embedding status' },
            { status: 500 },
        )
    }
}

export async function POST() {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const initialStatus = await getEmbeddingStatus()
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', ...initialStatus })}\n\n`))

                while (true) {
                    const movies = await getMoviesWithoutEmbedding(1)
                    if (movies.length === 0) break

                    const movie = movies[0]
                    const text = buildEmbeddingText(movie)
                    const embedding = await createEmbedding(text)
                    await saveMovieEmbedding(movie.id, embedding)

                    const status = await getEmbeddingStatus()
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'progress',
                        ...status,
                        lastProcessed: movie.seriesTitle,
                    })}\n\n`))
                }

                const finalStatus = await getEmbeddingStatus()
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', ...finalStatus })}\n\n`))
            } catch (error) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                })}\n\n`))
            } finally {
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}
