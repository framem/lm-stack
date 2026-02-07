import { NextRequest, NextResponse } from 'next/server'
import { searchMovies } from '@/src/data-access/movies'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('q')

    if (!query || query.trim() === '') {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const movies = await searchMovies(query.trim())
    return NextResponse.json(movies)
}
