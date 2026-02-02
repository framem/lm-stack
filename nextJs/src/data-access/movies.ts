import { prisma } from '@/src/lib/prisma'

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
