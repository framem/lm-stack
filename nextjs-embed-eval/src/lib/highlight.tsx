import React from 'react'

/**
 * Highlights occurrences of `phrase` within `content`.
 *
 * Fast path: exact substring match (case-insensitive, whitespace-normalized).
 * Fallback: word-based sliding window — splits phrase into words (>2 chars),
 * finds the densest window (50% of chunk, min 200 chars) and highlights matched words.
 */
export function highlightPhrase(content: string, phrase: string): React.ReactNode {
    if (!phrase) return content.slice(0, 200) + (content.length > 200 ? '...' : '')

    const normalized = content.replace(/\s+/g, ' ')
    const normalizedPhrase = phrase.replace(/\s+/g, ' ')

    // --- Fast path: exact substring match ---
    const idx = normalized.toLowerCase().indexOf(normalizedPhrase.toLowerCase())

    if (idx !== -1) {
        const matchEnd = idx + normalizedPhrase.length
        const ctx = Math.max(100, Math.round(normalized.length * 0.25))
        const start = Math.max(0, idx - ctx)
        const end = Math.min(normalized.length, matchEnd + ctx)

        const position = idx / normalized.length
        const badge = position < 0.2 ? '[Anfang]' : position > 0.8 ? '[Ende]' : '[Mitte]'

        return (
            <>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-mono mr-1">{badge}</span>
                {start > 0 && '...'}
                {normalized.slice(start, idx)}
                <mark className="bg-yellow-200 dark:bg-yellow-900/60 rounded px-0.5">
                    {normalized.slice(idx, matchEnd)}
                </mark>
                {normalized.slice(matchEnd, end)}
                {end < normalized.length && '...'}
            </>
        )
    }

    // --- Fallback: word-based sliding window ---
    const words = normalizedPhrase
        .split(/\s+/)
        .map(w => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''))
        .filter(w => w.length > 2)

    if (words.length === 0) {
        return (
            <>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-mono mr-1">[kein exakter Match]</span>
                {normalized.slice(0, 200)}{normalized.length > 200 && '...'}
            </>
        )
    }

    // Find all positions of each word in the normalized text
    const normalizedLower = normalized.toLowerCase()
    const hits: { pos: number; len: number; word: string }[] = []

    for (const word of words) {
        let searchFrom = 0
        while (true) {
            const found = normalizedLower.indexOf(word, searchFrom)
            if (found === -1) break
            hits.push({ pos: found, len: word.length, word })
            searchFrom = found + 1
        }
    }

    if (hits.length === 0) {
        return (
            <>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-mono mr-1">[kein exakter Match]</span>
                {normalized.slice(0, 200)}{normalized.length > 200 && '...'}
            </>
        )
    }

    // Sliding window: adaptive size based on chunk length (50%, min 200 chars)
    const windowSize = Math.max(200, Math.round(normalized.length * 0.5))
    let bestStart = 0
    let bestScore = 0

    for (let winStart = 0; winStart <= Math.max(0, normalized.length - windowSize); winStart += 10) {
        const winEnd = winStart + windowSize
        const uniqueWords = new Set<string>()
        for (const h of hits) {
            if (h.pos >= winStart && h.pos + h.len <= winEnd) {
                uniqueWords.add(h.word)
            }
        }
        if (uniqueWords.size > bestScore) {
            bestScore = uniqueWords.size
            bestStart = winStart
        }
    }

    const windowEnd = Math.min(normalized.length, bestStart + windowSize)

    // Collect hits within the best window
    const windowHits = hits
        .filter(h => h.pos >= bestStart && h.pos + h.len <= windowEnd)
        .sort((a, b) => a.pos - b.pos)

    // Deduplicate overlapping hits — keep longer matches
    const merged: { pos: number; len: number }[] = []
    for (const h of windowHits) {
        const last = merged[merged.length - 1]
        if (last && h.pos < last.pos + last.len) {
            // Overlapping — extend if needed
            const newEnd = Math.max(last.pos + last.len, h.pos + h.len)
            last.len = newEnd - last.pos
        } else {
            merged.push({ pos: h.pos, len: h.len })
        }
    }

    // Build highlighted output
    const parts: React.ReactNode[] = []
    let cursor = bestStart

    for (const m of merged) {
        if (m.pos > cursor) {
            parts.push(normalized.slice(cursor, m.pos))
        }
        parts.push(
            <mark key={m.pos} className="bg-yellow-200 dark:bg-yellow-900/60 rounded px-0.5">
                {normalized.slice(m.pos, m.pos + m.len)}
            </mark>
        )
        cursor = m.pos + m.len
    }
    if (cursor < windowEnd) {
        parts.push(normalized.slice(cursor, windowEnd))
    }

    const position = bestStart / normalized.length
    const badge = position < 0.2 ? '[Anfang]' : position > 0.8 ? '[Ende]' : '[Mitte]'

    return (
        <>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono mr-1">{badge}</span>
            {bestStart > 0 && '...'}
            {parts}
            {windowEnd < normalized.length && '...'}
        </>
    )
}
