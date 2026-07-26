import { CATEGORIES, type Category, type LogprobEntry } from './schema.js'

/** Converts a natural-log probability into a plain probability in [0, 1]. */
export function toProbability(logprob: number): number {
    return Math.exp(logprob)
}

export type CategoryDistribution = {
    /** Index of the token at which the categories become distinguishable. */
    tokenIndex: number
    /** The token the model actually sampled at that position. */
    token: string
    /** Probability per category, renormalised over the matched candidates. */
    probabilities: Array<{ category: Category; probability: number }>
}

/** Strips JSON scaffolding around a token so `"L` and `L` compare equally. */
function normalizeToken(token: string): string {
    return token.replace(/["\s]/g, '').toLowerCase()
}

/** The category a token unambiguously starts, or `null` if it fits none or several. */
function matchCategory(token: string): Category | null {
    const normalized = normalizeToken(token)
    if (normalized.length === 0) return null

    const matches = CATEGORIES.filter((category) =>
        category.toLowerCase().startsWith(normalized),
    )
    // Ambiguous prefixes carry no signal about which category was meant.
    return matches.length === 1 ? matches[0] : null
}

/**
 * Derives a category distribution from the token-level logprobs.
 *
 * The model emits the label as one or more tokens (e.g. `Leb` + `ensmittel`).
 * We look for the first position where the *sampled* token starts one category
 * and an alternative starts a different one — that is where the model actually
 * decided — and renormalise those candidates into a distribution.
 *
 * Anchoring on the sampled token matters: with constrained decoding the very
 * first position (`{` of the JSON envelope) also lists category tokens as
 * alternatives, but the model was not choosing a label there.
 *
 * This is a heuristic: it needs `top_logprobs` and it only works while the
 * category labels differ in their first tokens.
 */
export function deriveCategoryDistribution(
    entries: LogprobEntry[],
): CategoryDistribution | null {
    for (const [tokenIndex, entry] of entries.entries()) {
        const sampledCategory = matchCategory(entry.token)
        if (sampledCategory === null) continue

        // The sampled token is usually repeated inside top_logprobs, so dedupe.
        const candidates = new Map<string, number>()
        for (const candidate of [entry, ...(entry.top_logprobs ?? [])]) {
            const previous = candidates.get(candidate.token)
            if (previous === undefined || candidate.logprob > previous) {
                candidates.set(candidate.token, candidate.logprob)
            }
        }

        const best = new Map<Category, number>()
        for (const [token, logprob] of candidates) {
            const category = matchCategory(token)
            if (category === null) continue

            const previous = best.get(category)
            if (previous === undefined || logprob > previous) {
                best.set(category, logprob)
            }
        }

        if (best.size < 2) continue

        const raw = [...best].map(([category, logprob]) => ({
            category,
            probability: toProbability(logprob),
        }))
        const total = raw.reduce((sum, item) => sum + item.probability, 0)

        return {
            tokenIndex,
            token: entry.token,
            probabilities: raw
                .map((item) => ({ ...item, probability: item.probability / total }))
                .sort((a, b) => b.probability - a.probability),
        }
    }

    return null
}
