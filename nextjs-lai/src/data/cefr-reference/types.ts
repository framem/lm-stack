/**
 * CEFR reference vocabulary types.
 *
 * Based on the official Goethe-Institut word lists for the
 * Goethe-Zertifikat exams (A1, A2, B1), provided via the
 * DWDS (Digitales Wörterbuch der deutschen Sprache) API.
 *
 * Sources:
 *  - Goethe-Institut, "Goethe-Zertifikat A1: Start Deutsch 1 — Wortliste"
 *    https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf
 *  - Goethe-Institut, "Goethe-Zertifikat A2 — Wortliste"
 *    https://www.goethe.de/pro/relaunch/prf/sr/Goethe-Zertifikat_A2_Wortliste.pdf
 *  - DWDS machine-readable API
 *    https://www.dwds.de/lemma/wortschatz-goethe-zertifikat
 */

export type CefrLevel = 'A1' | 'A2' | 'B1'

export type Gender = 'mask.' | 'fem.' | 'neutr.'

export interface CefrWord {
    /** The word / lemma */
    lemma: string
    /** Part of speech (German linguistic term) */
    pos: string
    /** Grammatical gender(s) — only for nouns */
    gender?: Gender[]
    /** Article(s) — only for nouns */
    articles?: string[]
}

export interface CefrWordList {
    level: CefrLevel
    /** Total number of entries */
    count: number
    /** Source attribution */
    source: {
        name: string
        url: string
        apiUrl: string
        license: string
    }
    words: CefrWord[]
}
