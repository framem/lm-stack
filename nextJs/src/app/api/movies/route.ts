import { getMovies } from '@/src/data-access/movies'

export const dynamic = 'force-dynamic'

export async function GET() {
    const movies = await getMovies()
    return Response.json(movies)
}
