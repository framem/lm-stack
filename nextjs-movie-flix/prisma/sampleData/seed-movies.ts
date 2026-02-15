import { prisma } from '@/src/lib/prisma'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function parseCsvLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (inQuotes) {
            if (char === '"' && line[i + 1] === '"') {
                current += '"'
                i++
            } else if (char === '"') {
                inQuotes = false
            } else {
                current += char
            }
        } else {
            if (char === '"') {
                inQuotes = true
            } else if (char === ',') {
                fields.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
    }
    fields.push(current.trim())
    return fields
}

const load = async () => {
    const csvPath = resolve(import.meta.dirname!, 'imdb_top_1000.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim() !== '')

    // Skip header
    const dataLines = lines.slice(1)

    console.log(`Clear all movies`)
    await prisma.movie.deleteMany()

    console.log(`Seeding ${dataLines.length} movies...`)

    for (const line of dataLines) {
        const fields = parseCsvLine(line)
        const [
            posterLink, seriesTitle, releasedYear, certificate, runtime,
            genre, imdbRating, overview, metaScore, director,
            star1, star2, star3, star4, noOfVotes, gross
        ] = fields

        await prisma.movie.create({
            data: {
                posterLink: posterLink || null,
                seriesTitle: seriesTitle || 'Unknown',
                releasedYear: releasedYear || null,
                certificate: certificate || null,
                runtime: runtime || null,
                genre: genre || null,
                imdbRating: imdbRating ? parseFloat(imdbRating) || null : null,
                overview: overview || null,
                metaScore: metaScore ? parseInt(metaScore) || null : null,
                director: director || null,
                star1: star1 || null,
                star2: star2 || null,
                star3: star3 || null,
                star4: star4 || null,
                noOfVotes: noOfVotes ? parseInt(noOfVotes.replace(/,/g, '')) || null : null,
                gross: gross || null,
            }
        })
    }

    console.log('Done!')
}

void load()
