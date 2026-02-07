import { prisma } from '@/src/lib/prisma'

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
