import { NextRequest, NextResponse } from 'next/server'
import { searchMovies } from '@/src/data-access/movies'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('q')

    if (!query || query.trim() === '') {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const trimmed = query.trim()

    if (trimmed.length > 200) {
        return NextResponse.json({ error: 'Search query must not exceed 200 characters' }, { status: 400 })
    }

    const movies = await searchMovies(trimmed)
    return NextResponse.json(movies)
}
