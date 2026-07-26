import { CATEGORIES, type Category, type LogprobEntry } from './schema.js'

/** Converts a natural-log probability into a plain probability in [0, 1]. */
export function toProbability(logprob: number): number {
    return Math.exp(logprob)
}

export type CategoryDistribution = {
    /** The label token the model actually sampled. */
    token: string
    /** Probability per category, renormalised over the matched candidates. */
    probabilities: Array<{ category: Category; probability: number }>
}

/** Flat view of a distribution, e.g. `{ Lebensmittel: 0.7, Werkzeug: 0.3 }`. */
export type CategoryProbabilities = Record<Category, number>

/**
 * Expands a distribution to *all* categories. Categories the model never
 * considered at the decision token get `0`.
 */
export function toCategoryProbabilities(
    distribution: CategoryDistribution,
): CategoryProbabilities {
    const result = Object.fromEntries(
        CATEGORIES.map((category) => [category, 0]),
    ) as CategoryProbabilities

    for (const { category, probability } of distribution.probabilities) {
        result[category] = probability
    }
    return result
}

/** Normalises a token so ` Leb` and `Leb` compare equally. */
function normalizeToken(token: string): string {
    return token.trim().toLowerCase()
}

/** The category a token unambiguously starts, or `null` if it fits none or several. */
export function matchCategory(token: string): Category | null {
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
 * The model answers with the bare label, so its decision falls on the very first
 * token — `Leb` vs `Werk`. The alternatives in that token's `top_logprobs` are
 * the competing categories; everything after it (`ensmittel`) is already
 * determined. We renormalise the candidates over each other, since the rest of
 * the probability mass at that position sits on tokens that are no label at all.
 *
 * Requires `top_logprobs`, and works only while the labels differ in their first
 * token — `Lebensmittel` vs `Lederwaren` would both normalise to `Le`.
 */
export function deriveCategoryDistribution(
    entries: LogprobEntry[],
): CategoryDistribution | null {
    // Normally entry #0, but a model may emit a leading whitespace token first.
    const decision = entries.find((entry) => matchCategory(entry.token) !== null)
    if (decision === undefined) return null

    // Keep the highest logprob per category; the sampled token is repeated
    // inside top_logprobs, and spacing variants (`Leb`, ` Leb`) can collide.
    const best = new Map<Category, number>()
    for (const candidate of [decision, ...(decision.top_logprobs ?? [])]) {
        const category = matchCategory(candidate.token)
        if (category === null) continue

        const previous = best.get(category)
        if (previous === undefined || candidate.logprob > previous) {
            best.set(category, candidate.logprob)
        }
    }

    const raw = [...best].map(([category, logprob]) => ({
        category,
        probability: toProbability(logprob),
    }))
    const total = raw.reduce((sum, item) => sum + item.probability, 0)

    return {
        token: decision.token,
        probabilities: raw
            .map((item) => ({ ...item, probability: item.probability / total }))
            .sort((a, b) => b.probability - a.probability),
    }
}
