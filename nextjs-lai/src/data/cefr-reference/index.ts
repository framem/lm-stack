/**
 * Official CEFR vocabulary reference based on Goethe-Institut word lists.
 *
 * Sources:
 *  - Goethe-Institut, "Goethe-Zertifikat A1: Start Deutsch 1 — Wortliste"
 *    https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf
 *  - Goethe-Institut, "Goethe-Zertifikat A2 — Wortliste"
 *    https://www.goethe.de/pro/relaunch/prf/sr/Goethe-Zertifikat_A2_Wortliste.pdf
 *  - Goethe-Institut, "Goethe-Zertifikat B1 — Wortliste"
 *    https://www.goethe.de/pro/relaunch/prf/de/Goethe-Zertifikat_B1_Wortliste.pdf
 *  - DWDS (Digitales Wörterbuch der deutschen Sprache) — machine-readable API
 *    https://www.dwds.de/lemma/wortschatz-goethe-zertifikat
 *
 * Note: The word lists are copyright Goethe-Institut.
 * Data provided via the DWDS API for research and educational use.
 */

export type { CefrLevel, CefrWord, CefrWordList, Gender } from './types'

export { goetheA1 } from './goethe-a1'
export { goetheA2 } from './goethe-a2'
export { goetheB1 } from './goethe-b1'

import { goetheA1 } from './goethe-a1'
import { goetheA2 } from './goethe-a2'
import { goetheB1 } from './goethe-b1'
import type { CefrLevel, CefrWordList } from './types'

/** All word lists indexed by level */
const wordLists: Record<CefrLevel, CefrWordList> = {
    A1: goetheA1,
    A2: goetheA2,
    B1: goetheB1,
}

/** Get the official word list for a CEFR level */
export function getWordList(level: CefrLevel): CefrWordList {
    return wordLists[level]
}

/** Check if a German word appears in a specific CEFR level */
export function isInLevel(word: string, level: CefrLevel): boolean {
    const lower = word.toLowerCase()
    return wordLists[level].words.some((w) => w.lemma.toLowerCase() === lower)
}

/**
 * Find the lowest CEFR level that contains a given German word.
 * Returns undefined if the word is not in any level (A1–B1).
 */
export function getWordLevel(word: string): CefrLevel | undefined {
    const lower = word.toLowerCase()
    for (const level of ['A1', 'A2', 'B1'] as CefrLevel[]) {
        if (wordLists[level].words.some((w) => w.lemma.toLowerCase() === lower)) {
            return level
        }
    }
    return undefined
}
