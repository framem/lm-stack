import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock all external dependencies so route modules can be imported without side effects
vi.mock('@/src/data-access/movies', () => ({
    searchMovies: vi.fn(),
    getMoviesByGenre: vi.fn(),
    getTopRatedMovies: vi.fn(),
    getRecommendedMovies: vi.fn(),
    getEmbeddingStatus: vi.fn(),
    getMoviesWithoutEmbedding: vi.fn(),
    saveMovieEmbedding: vi.fn(),
    buildEmbeddingText: vi.fn(),
}))

vi.mock('@/src/lib/prisma', () => ({
    prisma: {
        movie: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
        $queryRaw: vi.fn(),
        $queryRawUnsafe: vi.fn(),
        $executeRawUnsafe: vi.fn(),
    },
}))

vi.mock('@/src/lib/llm', () => ({
    createEmbedding: vi.fn(),
    getModel: vi.fn(() => ({})),
}))

vi.mock('@/src/lib/slug', () => ({
    toMovieSlug: vi.fn((title: string, id: string) => `${title}-${id}`),
    toGenreSlug: vi.fn((g: string) => g.toLowerCase()),
}))

vi.mock('ai', () => ({
    streamText: vi.fn(() => ({
        toUIMessageStreamResponse: vi.fn(() => new Response('stream')),
    })),
    stepCountIs: vi.fn(),
    convertToModelMessages: vi.fn(() => []),
}))

import { searchMovies } from '@/src/data-access/movies'
import { streamText } from 'ai'

const mockSearchMovies = searchMovies as ReturnType<typeof vi.fn>
const mockStreamText = streamText as ReturnType<typeof vi.fn>

beforeEach(() => {
    vi.clearAllMocks()
    // Restore default streamText behavior after clearAllMocks
    mockStreamText.mockReturnValue({
        toUIMessageStreamResponse: vi.fn(() => new Response('stream')),
    })
})

// --- /api/search ---

describe('GET /api/search', () => {
    let GET: typeof import('../search/route').GET

    beforeEach(async () => {
        const mod = await import('../search/route')
        GET = mod.GET
    })

    it('should return results for a valid query', async () => {
        const mockMovies = [{ id: '1', seriesTitle: 'Inception' }]
        mockSearchMovies.mockResolvedValue(mockMovies)

        const request = new NextRequest('http://localhost/api/search?q=inception')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(mockMovies)
        expect(mockSearchMovies).toHaveBeenCalledWith('inception')
    })

    it('should return 400 when q param is missing', async () => {
        const request = new NextRequest('http://localhost/api/search')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Search query is required')
    })

    it('should return 400 when q param is empty', async () => {
        const request = new NextRequest('http://localhost/api/search?q=')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Search query is required')
    })

    it('should return 400 when q param is whitespace only', async () => {
        const request = new NextRequest('http://localhost/api/search?q=%20%20')
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Search query is required')
    })

    it('should return 400 when query exceeds 200 characters', async () => {
        const longQuery = 'a'.repeat(201)
        const request = new NextRequest(`http://localhost/api/search?q=${longQuery}`)
        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Search query must not exceed 200 characters')
    })

    it('should accept a query of exactly 200 characters', async () => {
        const maxQuery = 'a'.repeat(200)
        mockSearchMovies.mockResolvedValue([])

        const request = new NextRequest(`http://localhost/api/search?q=${maxQuery}`)
        const response = await GET(request)

        expect(response.status).toBe(200)
        expect(mockSearchMovies).toHaveBeenCalledWith(maxQuery)
    })

    it('should trim whitespace from query', async () => {
        mockSearchMovies.mockResolvedValue([])

        const request = new NextRequest('http://localhost/api/search?q=%20inception%20')
        const response = await GET(request)

        expect(response.status).toBe(200)
        expect(mockSearchMovies).toHaveBeenCalledWith('inception')
    })
})

// --- /api/chat ---

describe('POST /api/chat', () => {
    let POST: typeof import('../chat/route').POST

    beforeEach(async () => {
        const mod = await import('../chat/route')
        POST = mod.POST
    })

    it('should return 400 for invalid JSON body', async () => {
        const request = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: 'not json',
            headers: { 'Content-Type': 'application/json' },
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid JSON body')
    })

    it('should return 400 when messages is missing', async () => {
        const request = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('messages must be a non-empty array')
    })

    it('should return 400 when messages is an empty array', async () => {
        const request = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [] }),
            headers: { 'Content-Type': 'application/json' },
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('messages must be a non-empty array')
    })

    it('should return 400 when messages is not an array', async () => {
        const request = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: 'not an array' }),
            headers: { 'Content-Type': 'application/json' },
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('messages must be a non-empty array')
    })

    it('should return 400 when a message is missing role', async () => {
        const request = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [{ content: 'hello' }] }),
            headers: { 'Content-Type': 'application/json' },
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Each message must have a role and content string')
    })

    it('should return 400 when a message is missing content', async () => {
        const request = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [{ role: 'user' }] }),
            headers: { 'Content-Type': 'application/json' },
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Each message must have a role and content string')
    })

    it('should return a streaming response for valid messages', async () => {
        const request = new Request('http://localhost/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Recommend a movie' }],
            }),
            headers: { 'Content-Type': 'application/json' },
        })
        const response = await POST(request)

        expect(response.status).toBe(200)
        expect(mockStreamText).toHaveBeenCalledWith(
            expect.objectContaining({
                system: expect.any(String),
                messages: expect.any(Array),
                tools: expect.any(Object),
            })
        )
    })
})
