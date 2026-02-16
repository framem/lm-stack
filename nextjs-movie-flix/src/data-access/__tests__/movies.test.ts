import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Movie } from '@/prisma/generated/prisma/client'

vi.mock('@/src/lib/prisma', () => ({
    prisma: {
        movie: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        $queryRaw: vi.fn(),
        $queryRawUnsafe: vi.fn(),
        $executeRawUnsafe: vi.fn(),
    },
}))

vi.mock('@/src/lib/llm', () => ({
    createEmbedding: vi.fn(),
}))

import { prisma } from '@/src/lib/prisma'
import { createEmbedding } from '@/src/lib/llm'
import {
    getMovies,
    getMoviesByCategory,
    getAllGenres,
    getMoviesByGenre,
    getTopRatedMovies,
    getMovieById,
    getFeaturedMovie,
    getRecommendedMovies,
    searchMovies,
    getEmbeddingStatus,
    getMoviesWithoutEmbedding,
    saveMovieEmbedding,
    buildEmbeddingText,
} from '../movies'

const mockPrisma = prisma as unknown as {
    movie: {
        findMany: ReturnType<typeof vi.fn>
        findUnique: ReturnType<typeof vi.fn>
    }
    $queryRaw: ReturnType<typeof vi.fn>
    $queryRawUnsafe: ReturnType<typeof vi.fn>
    $executeRawUnsafe: ReturnType<typeof vi.fn>
}

const mockCreateEmbedding = createEmbedding as ReturnType<typeof vi.fn>

const mockMovie = {
    id: 'movie-1',
    posterLink: 'https://example.com/poster.jpg',
    seriesTitle: 'The Shawshank Redemption',
    releasedYear: '1994',
    certificate: 'A',
    runtime: '142 min',
    genre: 'Drama',
    imdbRating: 9.3,
    overview: 'Two imprisoned men bond over a number of years.',
    metaScore: 82,
    director: 'Frank Darabont',
    star1: 'Tim Robbins',
    star2: 'Morgan Freeman',
    star3: 'Bob Gunton',
    star4: 'William Sadler',
    noOfVotes: 2500000,
    gross: '$28.34M',
    embedding: null,
}

const mockMovie2 = {
    ...mockMovie,
    id: 'movie-2',
    seriesTitle: 'The Godfather',
    genre: 'Crime, Drama',
    imdbRating: 9.2,
    director: 'Francis Ford Coppola',
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('getMovies', () => {
    it('should return movies with take 3', async () => {
        mockPrisma.movie.findMany.mockResolvedValue([mockMovie])
        const result = await getMovies()
        expect(result).toEqual([mockMovie])
        expect(mockPrisma.movie.findMany).toHaveBeenCalledWith({ take: 3 })
    })
})

describe('getMoviesByCategory', () => {
    it('should filter movies by category case-insensitively', async () => {
        mockPrisma.movie.findMany.mockResolvedValue([mockMovie])
        const result = await getMoviesByCategory('Drama')
        expect(result).toEqual([mockMovie])
        expect(mockPrisma.movie.findMany).toHaveBeenCalledWith({
            where: { genre: { contains: 'Drama', mode: 'insensitive' } },
            take: 3,
        })
    })
})

describe('getAllGenres', () => {
    it('should return a flat list of genre strings', async () => {
        mockPrisma.$queryRaw.mockResolvedValue([
            { genre: 'Action' },
            { genre: 'Drama' },
            { genre: 'Sci-Fi' },
        ])
        const result = await getAllGenres()
        expect(result).toEqual(['Action', 'Drama', 'Sci-Fi'])
    })

    it('should return empty array when no genres exist', async () => {
        mockPrisma.$queryRaw.mockResolvedValue([])
        const result = await getAllGenres()
        expect(result).toEqual([])
    })
})

describe('getMoviesByGenre', () => {
    it('should filter by genre and order by rating desc', async () => {
        mockPrisma.movie.findMany.mockResolvedValue([mockMovie])
        const result = await getMoviesByGenre('Drama')
        expect(result).toEqual([mockMovie])
        expect(mockPrisma.movie.findMany).toHaveBeenCalledWith({
            where: { genre: { contains: 'Drama', mode: 'insensitive' } },
            orderBy: { imdbRating: 'desc' },
            take: 20,
        })
    })

    it('should respect custom take parameter', async () => {
        mockPrisma.movie.findMany.mockResolvedValue([mockMovie])
        await getMoviesByGenre('Drama', 5)
        expect(mockPrisma.movie.findMany).toHaveBeenCalledWith({
            where: { genre: { contains: 'Drama', mode: 'insensitive' } },
            orderBy: { imdbRating: 'desc' },
            take: 5,
        })
    })
})

describe('getTopRatedMovies', () => {
    it('should return movies ordered by rating desc', async () => {
        mockPrisma.movie.findMany.mockResolvedValue([mockMovie, mockMovie2])
        const result = await getTopRatedMovies()
        expect(result).toEqual([mockMovie, mockMovie2])
        expect(mockPrisma.movie.findMany).toHaveBeenCalledWith({
            where: { imdbRating: { not: null } },
            orderBy: { imdbRating: 'desc' },
            take: 20,
        })
    })

    it('should respect custom take parameter', async () => {
        mockPrisma.movie.findMany.mockResolvedValue([mockMovie])
        await getTopRatedMovies(5)
        expect(mockPrisma.movie.findMany).toHaveBeenCalledWith({
            where: { imdbRating: { not: null } },
            orderBy: { imdbRating: 'desc' },
            take: 5,
        })
    })
})

describe('getMovieById', () => {
    it('should return a movie by id', async () => {
        mockPrisma.movie.findUnique.mockResolvedValue(mockMovie)
        const result = await getMovieById('movie-1')
        expect(result).toEqual(mockMovie)
        expect(mockPrisma.movie.findUnique).toHaveBeenCalledWith({
            where: { id: 'movie-1' },
        })
    })

    it('should return null when movie not found', async () => {
        mockPrisma.movie.findUnique.mockResolvedValue(null)
        const result = await getMovieById('nonexistent')
        expect(result).toBeNull()
    })
})

describe('getFeaturedMovie', () => {
    it('should return a random top-rated movie', async () => {
        const topMovies = [mockMovie, mockMovie2]
        mockPrisma.movie.findMany.mockResolvedValue(topMovies)
        vi.spyOn(Math, 'random').mockReturnValue(0)

        const result = await getFeaturedMovie()
        expect(result).toEqual(mockMovie)
        expect(mockPrisma.movie.findMany).toHaveBeenCalledWith({
            where: {
                imdbRating: { gte: 8.5 },
                posterLink: { not: null },
                overview: { not: null },
            },
            orderBy: { imdbRating: 'desc' },
            take: 20,
        })

        vi.spyOn(Math, 'random').mockRestore()
    })

    it('should return second movie when random picks index 1', async () => {
        const topMovies = [mockMovie, mockMovie2]
        mockPrisma.movie.findMany.mockResolvedValue(topMovies)
        vi.spyOn(Math, 'random').mockReturnValue(0.5)

        const result = await getFeaturedMovie()
        expect(result).toEqual(mockMovie2)

        vi.spyOn(Math, 'random').mockRestore()
    })

    it('should fallback to first movie when random result is out of bounds', async () => {
        mockPrisma.movie.findMany.mockResolvedValue([mockMovie])
        vi.spyOn(Math, 'random').mockReturnValue(0.99)

        const result = await getFeaturedMovie()
        expect(result).toEqual(mockMovie)

        vi.spyOn(Math, 'random').mockRestore()
    })

    it('should return undefined when no top movies exist', async () => {
        mockPrisma.movie.findMany.mockResolvedValue([])
        vi.spyOn(Math, 'random').mockReturnValue(0)

        const result = await getFeaturedMovie()
        expect(result).toBeUndefined()

        vi.spyOn(Math, 'random').mockRestore()
    })
})

describe('getRecommendedMovies', () => {
    it('should return empty array when movie not found', async () => {
        mockPrisma.movie.findUnique.mockResolvedValue(null)
        const result = await getRecommendedMovies('nonexistent')
        expect(result).toEqual([])
    })

    it('should return similar movies when movie has embedding', async () => {
        mockPrisma.movie.findUnique.mockResolvedValue(mockMovie)
        mockPrisma.$queryRaw
            .mockResolvedValueOnce([{ has_embedding: true }])
            .mockResolvedValueOnce([mockMovie2])

        const result = await getRecommendedMovies('movie-1')
        expect(result).toEqual([mockMovie2])
    })

    it('should return empty array when movie has no embedding', async () => {
        mockPrisma.movie.findUnique.mockResolvedValue(mockMovie)
        mockPrisma.$queryRaw.mockResolvedValueOnce([{ has_embedding: false }])

        const result = await getRecommendedMovies('movie-1')
        expect(result).toEqual([])
    })
})

describe('searchMovies', () => {
    it('should search using embedding and title', async () => {
        const fakeEmbedding = [0.1, 0.2, 0.3]
        mockCreateEmbedding.mockResolvedValue(fakeEmbedding)
        mockPrisma.$queryRawUnsafe.mockResolvedValue([mockMovie])

        const result = await searchMovies('shawshank')
        expect(result).toEqual([mockMovie])
        expect(mockCreateEmbedding).toHaveBeenCalledWith('shawshank')
        expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
            expect.any(String),
            '%shawshank%',
            '[0.1,0.2,0.3]',
            20,
            0.7
        )
    })

    it('should respect custom take parameter', async () => {
        mockCreateEmbedding.mockResolvedValue([0.1])
        mockPrisma.$queryRawUnsafe.mockResolvedValue([])

        await searchMovies('test', 5)
        expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
            expect.any(String),
            '%test%',
            '[0.1]',
            5,
            0.7
        )
    })
})

describe('getEmbeddingStatus', () => {
    it('should return total, embedded, and percentage', async () => {
        mockPrisma.$queryRaw.mockResolvedValue([{ total: 100, embedded: 75 }])
        const result = await getEmbeddingStatus()
        expect(result).toEqual({ total: 100, embedded: 75, percentage: 75 })
    })

    it('should return 0 percentage when total is 0', async () => {
        mockPrisma.$queryRaw.mockResolvedValue([{ total: 0, embedded: 0 }])
        const result = await getEmbeddingStatus()
        expect(result).toEqual({ total: 0, embedded: 0, percentage: 0 })
    })

    it('should round percentage correctly', async () => {
        mockPrisma.$queryRaw.mockResolvedValue([{ total: 3, embedded: 1 }])
        const result = await getEmbeddingStatus()
        expect(result).toEqual({ total: 3, embedded: 1, percentage: 33 })
    })
})

describe('getMoviesWithoutEmbedding', () => {
    it('should return movies without embeddings', async () => {
        mockPrisma.$queryRaw.mockResolvedValue([mockMovie])
        const result = await getMoviesWithoutEmbedding()
        expect(result).toEqual([mockMovie])
    })

    it('should respect custom take parameter', async () => {
        mockPrisma.$queryRaw.mockResolvedValue([])
        await getMoviesWithoutEmbedding(5)
        expect(mockPrisma.$queryRaw).toHaveBeenCalled()
    })
})

describe('saveMovieEmbedding', () => {
    it('should save embedding as vector string', async () => {
        mockPrisma.$executeRawUnsafe.mockResolvedValue(1)
        await saveMovieEmbedding('movie-1', [0.1, 0.2, 0.3])
        expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
            'UPDATE "Movie" SET embedding = $1::vector WHERE id = $2',
            '[0.1,0.2,0.3]',
            'movie-1'
        )
    })
})

describe('buildEmbeddingText', () => {
    it('should build text from all movie fields', () => {
        const result = buildEmbeddingText(mockMovie as Movie)
        expect(result).toBe(
            'The Shawshank Redemption. Drama. Two imprisoned men bond over a number of years.. Director: Frank Darabont. Stars: Tim Robbins, Morgan Freeman, Bob Gunton, William Sadler'
        )
    })

    it('should handle movie with missing optional fields', () => {
        const partialMovie = {
            id: 'movie-3',
            seriesTitle: 'Test Movie',
            posterLink: null,
            releasedYear: null,
            certificate: null,
            runtime: null,
            genre: null,
            imdbRating: null,
            overview: null,
            metaScore: null,
            director: null,
            star1: null,
            star2: null,
            star3: null,
            star4: null,
            noOfVotes: null,
            gross: null,
            embedding: null,
        }
        const result = buildEmbeddingText(partialMovie as Movie)
        expect(result).toBe('Test Movie')
    })

    it('should handle movie with no stars', () => {
        const movieNoStars = {
            ...mockMovie,
            star1: null,
            star2: null,
            star3: null,
            star4: null,
        }
        const result = buildEmbeddingText(movieNoStars as Movie)
        expect(result).toBe(
            'The Shawshank Redemption. Drama. Two imprisoned men bond over a number of years.. Director: Frank Darabont'
        )
    })

    it('should handle movie with some stars', () => {
        const movieSomeStars = {
            ...mockMovie,
            star3: null,
            star4: null,
        }
        const result = buildEmbeddingText(movieSomeStars as Movie)
        expect(result).toBe(
            'The Shawshank Redemption. Drama. Two imprisoned men bond over a number of years.. Director: Frank Darabont. Stars: Tim Robbins, Morgan Freeman'
        )
    })
})
