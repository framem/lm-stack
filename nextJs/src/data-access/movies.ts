import { prisma } from '@/src/lib/prisma'

export async function getMovies() {
    return prisma.movie.findMany({
        take: 3,
    })
}
