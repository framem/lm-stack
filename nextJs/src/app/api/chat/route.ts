import { streamText, stepCountIs, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { getMoviesByGenre, getTopRatedMovies } from '@/src/data-access/movies'
import { prisma } from '@/src/lib/prisma'
import { getModel } from '@/src/lib/llm'
import { toMovieSlug } from '@/src/lib/slug'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

const tools = {
    searchByTitle: {
        description: 'Suche Filme anhand des Titels (Teilstring-Suche)',
        inputSchema: z.object({
            query: z.string().describe('Suchbegriff für den Filmtitel'),
        }),
        execute: async ({ query }: { query: string }) => {
            const movies = await prisma.movie.findMany({
                where: {
                    seriesTitle: { contains: query, mode: 'insensitive' as const },
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
                link: `${BASE_URL}/movie/${toMovieSlug(m.seriesTitle, m.id)}`,
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
                link: `${BASE_URL}/movie/${toMovieSlug(m.seriesTitle, m.id)}`,
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
                link: `${BASE_URL}/movie/${toMovieSlug(m.seriesTitle, m.id)}`,
            }))
        },
    },
}

export async function POST(req: Request) {
    const { messages: uiMessages } = await req.json()

    const modelMessages = await convertToModelMessages(uiMessages, { tools })

    const result = streamText({
        model: getModel(),
        system: `Du bist ein freundlicher Filmberater. Du hilfst Nutzern, Filme zu finden, die ihnen gefallen könnten.
Du hast Zugriff auf eine Datenbank mit den Top 1000 IMDb-Filmen.
Nutze die verfügbaren Tools, um Filme zu suchen und Empfehlungen zu geben.
Antworte immer auf Deutsch, es sei denn, der Nutzer schreibt auf Englisch.
Halte deine Antworten kurz und übersichtlich. Nenne pro Empfehlung den Titel, das Jahr und eine kurze Begründung.
Jeder Film in den Tool-Ergebnissen enthält ein "link"-Feld. Verlinke den Filmtitel immer mit diesem Link im Markdown-Format, z.B. [Inception (2010)](http://localhost:3000/movie/inception-abc123).`,
        messages: modelMessages,
        tools,
        stopWhen: stepCountIs(3),
    })

    return result.toUIMessageStreamResponse()
}
