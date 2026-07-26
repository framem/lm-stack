import { generateText } from 'ai'
import { getModel, providerOptionsKey, supportsLogprobs } from './llm.js'
import { CATEGORIES, extractLogprobs, type Category, type LogprobEntry } from './schema.js'
import {
    deriveCategoryDistribution,
    toCategoryProbabilities,
    type CategoryDistribution,
    type CategoryProbabilities,
} from './probabilities.js'

const SYSTEM_PROMPT = [
    'Du bist ein Klassifikator.',
    `Ordne den Text des Nutzers genau einer dieser Kategorien zu: ${CATEGORIES.join(', ')}.`,
    'Antworte ausschließlich mit der Kategorie, ohne Begründung.',
].join(' ')

/** How many alternative tokens the backend should report per position. */
const TOP_LOGPROBS = 5

/**
 * Minimum confidence before a label counts as decided.
 *
 * Both strategies enforce the same number, just at different places: the prompt
 * variant states it as an instruction and trusts the model's self-assessment,
 * the logits variant measures it against the actual token distribution.
 */
export const CONFIDENCE_THRESHOLD = 0.7

/** The threshold as a percentage, for prompts and console output alike. */
export function formatThreshold(): string {
    return `${(CONFIDENCE_THRESHOLD * 100).toFixed(0)} %`
}

/** Matches the model's answer against the category list, ignoring case and punctuation. */
function parseCategory(answer: string): Category | undefined {
    const normalized = answer.trim().replace(/[.!\s]+$/, '').toLowerCase()
    return CATEGORIES.find((category) => category.toLowerCase() === normalized)
}

/** The two strategies we compare: read the token distribution vs. just ask. */
export const METHODS = ['logits', 'prompt'] as const
export type ClassificationMethod = (typeof METHODS)[number]

/** Human-readable column header per method. */
export const METHOD_LABELS: Record<ClassificationMethod, string> = {
    logits: 'Logits',
    prompt: 'Prompt',
}

export type ClassificationResult = {
    method: ClassificationMethod
    text: string
    /** The decision: argmax of the measured distribution, else the emitted label. */
    category: Category
    /** The label the model actually wrote — can differ from `category`. */
    sampledCategory: Category
    /** Per-token logprobs of the completion, or `null` if unsupported. */
    logProbs: LogprobEntry[] | null
    /** Flat `{ Kategorie: Wahrscheinlichkeit }` map, or `null` if unavailable. */
    probabilities: CategoryProbabilities | null
    /** The same numbers plus the token they were measured at (for debugging). */
    distribution: CategoryDistribution | null
    /** Measured probability of the chosen category, or `null` if not measurable. */
    confidence: number | null
    /**
     * Whether the confidence clears `CONFIDENCE_THRESHOLD`. `null` when there is
     * nothing to measure — the prompt variant only ever claims to be sure.
     */
    confident: boolean | null
}

type ClassifyOptions = {
    method: ClassificationMethod
    system: string
    /** Whether to ask the backend for token logprobs at all. */
    requestLogprobs: boolean
}

/**
 * Shared request path for both strategies. Everything except the system prompt
 * and the logprobs request is identical, so the two are directly comparable.
 */
async function classify(text: string, options: ClassifyOptions): Promise<ClassificationResult> {
    const result = await generateText({
        model: getModel(),
        system: options.system,
        prompt: text,
        temperature: 0,
        // The label is a few tokens; the slack only absorbs stray punctuation.
        maxOutputTokens: 8,
        // Unknown keys are forwarded verbatim into the OpenAI-compatible body,
        // so snake_case is required here.
        providerOptions:
            options.requestLogprobs && supportsLogprobs
                ? { [providerOptionsKey]: { logprobs: true, top_logprobs: TOP_LOGPROBS } }
                : {},
        // Needed to read the provider's raw response body (where logprobs live).
        include: { responseBody: true },
    })

    const sampledCategory = parseCategory(result.text)
    if (sampledCategory === undefined) {
        throw new Error(
            `Unerwartete Antwort ${JSON.stringify(result.text)} — erwartet wurde eine von: ${CATEGORIES.join(', ')}.`,
        )
    }

    const logProbs = options.requestLogprobs
        ? extractLogprobs(result.finalStep.response.body)
        : null
    const distribution = logProbs ? deriveCategoryDistribution(logProbs) : null
    const probabilities = distribution ? toCategoryProbabilities(distribution) : null

    // Decide from the distribution, not from the text: at temperature 0 the
    // backend still does not always emit the top-ranked label token, so the
    // measured argmax is the more faithful reading of the model's belief.
    const category = distribution?.probabilities[0]?.category ?? sampledCategory

    // The same threshold the prompt variant merely asks for, here measured.
    const confidence = probabilities?.[category] ?? null

    return {
        method: options.method,
        text,
        category,
        sampledCategory,
        logProbs: logProbs,
        probabilities: probabilities,
        distribution: distribution,
        confidence: confidence,
        confident: confidence === null ? null : confidence >= CONFIDENCE_THRESHOLD,
    }
}

/** Classifies and reads the confidence out of the token distribution. */
export async function classifyOnlyViaLogits(text: string): Promise<ClassificationResult> {
    return classify(text, {
        method: 'logits',
        system: SYSTEM_PROMPT,
        requestLogprobs: true,
    })
}

/** Classifies with the model's own confidence threshold, no logprobs involved. */
export async function classifyOnlyViaPrompt(text: string): Promise<ClassificationResult> {
    return classify(text, {
        method: 'prompt',
        system: `${SYSTEM_PROMPT}\nAntworte nur, wenn du sicher bist (>${formatThreshold()}).`,
        requestLogprobs: false,
    })
}