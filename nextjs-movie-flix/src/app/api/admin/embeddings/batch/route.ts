import {
    getEmbeddingStatus,
    getMoviesWithoutEmbedding,
    saveMovieEmbeddings,
    buildEmbeddingText,
} from '@/src/data-access/movies'
import { createEmbeddings } from '@/src/lib/llm'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BATCH_SIZE = 50

export async function POST() {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const initialStatus = await getEmbeddingStatus()
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', ...initialStatus })}\n\n`))

                while (true) {
                    const movies = await getMoviesWithoutEmbedding(BATCH_SIZE)
                    if (movies.length === 0) break

                    const texts = movies.map(buildEmbeddingText)
                    const embeddings = await createEmbeddings(texts)
                    await saveMovieEmbeddings(
                        movies.map(m => m.id),
                        embeddings,
                    )

                    const status = await getEmbeddingStatus()
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'progress',
                        ...status,
                        lastProcessed: `${movies.length} Filme (Batch)`,
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
