import { prisma } from '@/src/lib/prisma'
import { type Movie } from '@/prisma/generated/prisma/client'

// Existing functions (kept for MCP compatibility)
export async function getMovies() {
    return prisma.movie.findMany({
        take: 3,
    })
}

export async function getMoviesByCategory(category: string) {
    return prisma.movie.findMany({
        where: {
            genre: {
                contains: category,
                mode: 'insensitive',
            },
        },
        take: 3
    })
}

// --- New functions for Netflix-style UI ---

export async function getAllGenres(): Promise<string[]> {
    const result = await prisma.$queryRaw<{ genre: string }[]>`
        SELECT DISTINCT TRIM(unnest(string_to_array(genre, ','))) as genre
        FROM "Movie"
        WHERE genre IS NOT NULL
        ORDER BY genre
    `
    return result.map(r => r.genre)
}

export async function getMoviesByGenre(genre: string, take = 20) {
    return prisma.movie.findMany({
        where: {
            genre: {
                contains: genre,
                mode: 'insensitive',
            },
        },
        orderBy: { imdbRating: 'desc' },
        take,
    })
}

export async function getTopRatedMovies(take = 20) {
    return prisma.movie.findMany({
        where: { imdbRating: { not: null } },
        orderBy: { imdbRating: 'desc' },
        take,
    })
}

export async function getMovieById(id: string) {
    return prisma.movie.findUnique({
        where: { id },
    })
}

export async function getFeaturedMovie() {
    const topMovies = await prisma.movie.findMany({
        where: {
            imdbRating: { gte: 8.5 },
            posterLink: { not: null },
            overview: { not: null },
        },
        orderBy: { imdbRating: 'desc' },
        take: 20,
    })
    return topMovies[Math.floor(Math.random() * topMovies.length)] ?? topMovies[0]
}

export async function getRecommendedMovies(movieId: string, take = 12) {
    const movie = await getMovieById(movieId)
    if (!movie) return []

    // Check if this movie has an embedding (Prisma can't read Unsupported types directly)
    const [{ has_embedding }] = await prisma.$queryRaw<{ has_embedding: boolean }[]>`
        SELECT embedding IS NOT NULL as has_embedding FROM "Movie" WHERE id = ${movieId}
    `

    if (has_embedding) {
        return prisma.$queryRaw<Movie[]>`
            SELECT m.id, m."posterLink", m."seriesTitle", m."releasedYear", m.certificate,
                   m.runtime, m.genre, m."imdbRating", m.overview, m."metaScore",
                   m.director, m.star1, m.star2, m.star3, m.star4, m."noOfVotes", m.gross
            FROM "Movie" m
            WHERE m.id != ${movieId}
              AND m.embedding IS NOT NULL
            ORDER BY m.embedding <=> (SELECT embedding FROM "Movie" WHERE id = ${movieId})
            LIMIT ${take}
        `
    }

    // Fallback: genre-based recommendations
    if (!movie.genre) return []
    const genres = movie.genre.split(',').map(g => g.trim()).filter(Boolean)

    return prisma.movie.findMany({
        where: {
            AND: [
                { id: { not: movieId } },
                {
                    OR: genres.map(genre => ({
                        genre: {
                            contains: genre,
                            mode: 'insensitive' as const,
                        },
                    })),
                },
            ],
        },
        orderBy: { imdbRating: 'desc' },
        take,
    })
}
