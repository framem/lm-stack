import { streamText, stepCountIs } from 'ai'
import { ollama } from 'ai-sdk-ollama'
import { z } from 'zod'
import { getMoviesByGenre, getTopRatedMovies } from '@/src/data-access/movies'
import { prisma } from '@/src/lib/prisma'

export async function POST(req: Request) {
    const { messages } = await req.json()

    const result = streamText({
        model: ollama('qwen3:8b', { options: { num_ctx: 4096 } }),
        system: `Du bist ein freundlicher Filmberater. Du hilfst Nutzern, Filme zu finden, die ihnen gefallen könnten.
Du hast Zugriff auf eine Datenbank mit den Top 1000 IMDb-Filmen.
Nutze die verfügbaren Tools, um Filme zu suchen und Empfehlungen zu geben.
Antworte immer auf Deutsch, es sei denn, der Nutzer schreibt auf Englisch.
Halte deine Antworten kurz und übersichtlich. Nenne pro Empfehlung den Titel, das Jahr und eine kurze Begründung.`,
        messages,
        tools: {
            searchByTitle: {
                description: 'Suche Filme anhand des Titels (Teilstring-Suche)',
                inputSchema: z.object({
                    query: z.string().describe('Suchbegriff für den Filmtitel'),
                }),
                execute: async ({ query }: { query: string }) => {
                    const movies = await prisma.movie.findMany({
                        where: {
                            seriesTitle: { contains: query, mode: 'insensitive' },
                        },
                        take: 10,
                        orderBy: { imdbRating: 'desc' },
                    })
                    return movies.map(m => ({
                        title: m.seriesTitle,
                        year: m.releasedYear,
                        rating: m.imdbRating,
                        genre: m.genre,
                        overview: m.overview,
                        director: m.director,
                    }))
                },
            },
            getByGenre: {
                description: 'Hole die besten Filme eines bestimmten Genres (z.B. Action, Comedy, Drama, Sci-Fi, Horror, Thriller)',
                inputSchema: z.object({
                    genre: z.string().describe('Das Genre, z.B. Action, Comedy, Drama'),
                    limit: z.number().optional().default(5).describe('Anzahl der Ergebnisse'),
                }),
                execute: async ({ genre, limit }: { genre: string; limit: number }) => {
                    const movies = await getMoviesByGenre(genre, limit)
                    return movies.map(m => ({
                        title: m.seriesTitle,
                        year: m.releasedYear,
                        rating: m.imdbRating,
                        genre: m.genre,
                        overview: m.overview,
                        director: m.director,
                    }))
                },
            },
            getTopRated: {
                description: 'Hole die am besten bewerteten Filme insgesamt',
                inputSchema: z.object({
                    limit: z.number().optional().default(5).describe('Anzahl der Ergebnisse'),
                }),
                execute: async ({ limit }: { limit: number }) => {
                    const movies = await getTopRatedMovies(limit)
                    return movies.map(m => ({
                        title: m.seriesTitle,
                        year: m.releasedYear,
                        rating: m.imdbRating,
                        genre: m.genre,
                        overview: m.overview,
                        director: m.director,
                    }))
                },
            },
        },
        stopWhen: stepCountIs(3),
    })

    return result.toUIMessageStreamResponse()
}
