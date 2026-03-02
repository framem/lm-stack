// ── Word-by-word pronunciation comparison and tips ─────────────────────

export type WordMatchStatus = 'match' | 'partial' | 'mismatch' | 'missing' | 'extra'

export interface WordComparison {
    expected: string
    recognized: string
    status: WordMatchStatus
}

// Compare expected vs recognized text word-by-word using LCS alignment
export function comparePronunciation(expected: string, recognized: string): WordComparison[] {
    const expWords = expected.trim().split(/\s+/)
    const recWords = recognized.trim().split(/\s+/)

    // Compute LCS table for word-level alignment
    const m = expWords.length
    const n = recWords.length
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (wordsMatch(expWords[i - 1], recWords[j - 1]) === 'match') {
                dp[i][j] = dp[i - 1][j - 1] + 1
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
            }
        }
    }

    // Backtrack to build aligned comparison
    const result: WordComparison[] = []
    let i = m, j = n
    const aligned: Array<{ ei: number; ri: number }> = []

    while (i > 0 && j > 0) {
        if (wordsMatch(expWords[i - 1], recWords[j - 1]) === 'match') {
            aligned.unshift({ ei: i - 1, ri: j - 1 })
            i--; j--
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            i--
        } else {
            j--
        }
    }

    // Build result by walking through both arrays with alignment anchors
    let ei = 0, ri = 0, ai = 0

    while (ei < m || ri < n) {
        if (ai < aligned.length && ei === aligned[ai].ei && ri === aligned[ai].ri) {
            // Aligned match
            result.push({
                expected: expWords[ei],
                recognized: recWords[ri],
                status: 'match',
            })
            ei++; ri++; ai++
        } else if (ai < aligned.length && ei < aligned[ai].ei && ri < aligned[ai].ri) {
            // Both have unmatched words before next anchor — pair them
            const status = wordsMatch(expWords[ei], recWords[ri])
            result.push({
                expected: expWords[ei],
                recognized: recWords[ri],
                status,
            })
            ei++; ri++
        } else if (ai < aligned.length && ei < aligned[ai].ei) {
            // Expected word has no recognized counterpart
            result.push({
                expected: expWords[ei],
                recognized: '',
                status: 'missing',
            })
            ei++
        } else if (ai < aligned.length && ri < aligned[ai].ri) {
            // Recognized word has no expected counterpart
            result.push({
                expected: '',
                recognized: recWords[ri],
                status: 'extra',
            })
            ri++
        } else if (ei < m && ri < n) {
            // Past all anchors, pair remaining
            const status = wordsMatch(expWords[ei], recWords[ri])
            result.push({
                expected: expWords[ei],
                recognized: recWords[ri],
                status,
            })
            ei++; ri++
        } else if (ei < m) {
            result.push({
                expected: expWords[ei],
                recognized: '',
                status: 'missing',
            })
            ei++
        } else {
            result.push({
                expected: '',
                recognized: recWords[ri],
                status: 'extra',
            })
            ri++
        }
    }

    return result
}

// Check how well two words match
function wordsMatch(a: string, b: string): WordMatchStatus {
    const la = a.toLowerCase().replace(/[^a-zäöüßàáâãèéêìíîòóôùúûñ]/g, '')
    const lb = b.toLowerCase().replace(/[^a-zäöüßàáâãèéêìíîòóôùúûñ]/g, '')

    if (la === lb) return 'match'

    // Check for partial match (first letters same and similar length)
    if (la.length > 2 && lb.length > 2) {
        const shorter = Math.min(la.length, lb.length)
        const longer = Math.max(la.length, lb.length)
        let matchCount = 0
        for (let i = 0; i < shorter; i++) {
            if (la[i] === lb[i]) matchCount++
        }
        if (matchCount / longer >= 0.6) return 'partial'
    }

    return 'mismatch'
}

// ── Pronunciation tips for common difficult sounds ─────────────────────

interface PronunciationTipEntry {
    patterns: RegExp[]
    tip: string
    language: string
}

const PRONUNCIATION_TIPS: PronunciationTipEntry[] = [
    // English tips (common mistakes for German speakers)
    {
        patterns: [/^th/i, /th$/i, /th[aeiou]/i],
        tip: 'Das "th" wird mit der Zunge zwischen den Zähnen gebildet — nicht wie "s" oder "f".',
        language: 'en',
    },
    {
        patterns: [/^w/i, /wh/i],
        tip: 'Das "w" wird mit gerundeten Lippen gesprochen — nicht wie ein deutsches "v".',
        language: 'en',
    },
    {
        patterns: [/v[aeiou]/i, /^v/i],
        tip: 'Das englische "v" klingt weicher als im Deutschen. Unterlippe leicht an die oberen Zähne.',
        language: 'en',
    },
    {
        patterns: [/[aeiou]r$/i, /r[aeiou]/i, /^r/i],
        tip: 'Das englische "r" wird NICHT gerollt. Die Zungenspitze berührt den Gaumen nicht.',
        language: 'en',
    },
    {
        patterns: [/ing$/i, /ng$/i],
        tip: 'Die Endung "-ing" wird als /ɪŋ/ gesprochen — kein hartes "g" am Ende.',
        language: 'en',
    },
    {
        patterns: [/ough/i, /ough$/i],
        tip: '"ough" hat viele Aussprachen: "through" (/uː/), "though" (/oʊ/), "tough" (/ʌf/), "thought" (/ɔː/).',
        language: 'en',
    },
    {
        patterns: [/[bcdfghjklmnpqrstvwxyz]ed$/i],
        tip: 'Die Endung "-ed" wird je nach Auslaut als /t/, /d/ oder /ɪd/ gesprochen.',
        language: 'en',
    },
    {
        patterns: [/ea/i],
        tip: '"ea" kann als /iː/ (sea), /ɛ/ (head) oder /eɪ/ (great) ausgesprochen werden.',
        language: 'en',
    },
    {
        patterns: [/oo/i],
        tip: '"oo" wird meistens als langes /uː/ (food) oder kurzes /ʊ/ (book) gesprochen.',
        language: 'en',
    },
    {
        patterns: [/[sc]h/i],
        tip: '"sh" wird als /ʃ/ gesprochen (wie deutsches "sch"), "ch" oft als /tʃ/ (wie "tsch").',
        language: 'en',
    },
    // Spanish tips
    {
        patterns: [/rr/i, /^r/i],
        tip: 'Das spanische "rr" wird stark gerollt. Ein einfaches "r" am Wortanfang ebenfalls.',
        language: 'es',
    },
    {
        patterns: [/ñ/i],
        tip: 'Das "ñ" wird wie "nj" gesprochen (ähnlich wie deutsches "Cognac").',
        language: 'es',
    },
    {
        patterns: [/ll/i],
        tip: '"ll" wird je nach Region als /j/, /ʒ/ oder /dʒ/ gesprochen.',
        language: 'es',
    },
    // French tips
    {
        patterns: [/ou/i],
        tip: 'Das französische "ou" wird als /u/ gesprochen (wie deutsches "u").',
        language: 'fr',
    },
    {
        patterns: [/[aeiou]n$/i, /[aeiou]m$/i],
        tip: 'Nasalvokale: Vor "n" oder "m" am Silbenende wird der Vokal nasal gesprochen.',
        language: 'fr',
    },
    {
        patterns: [/r/i],
        tip: 'Das französische "r" wird im Rachen gebildet (uvulares R), nicht mit der Zungenspitze.',
        language: 'fr',
    },
]

// Get pronunciation tip for a word in a given language
export function getPronunciationTip(word: string, language: string): string | null {
    // Extract the base language code (e.g., 'en' from 'en-US')
    const langBase = language.split('-')[0]

    for (const entry of PRONUNCIATION_TIPS) {
        if (entry.language !== langBase) continue
        for (const pattern of entry.patterns) {
            if (pattern.test(word)) return entry.tip
        }
    }

    return null
}

// Get all applicable tips for a list of mismatched words
export function getPronunciationTips(
    words: string[],
    language: string
): Array<{ word: string; tip: string }> {
    const seen = new Set<string>()
    const tips: Array<{ word: string; tip: string }> = []

    for (const word of words) {
        const tip = getPronunciationTip(word, language)
        if (tip && !seen.has(tip)) {
            seen.add(tip)
            tips.push({ word, tip })
        }
    }

    return tips
}
