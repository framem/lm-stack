import { generateText } from 'ai'
import { canDisableReasoning, getModel, providerOptionsKey, supportsLogprobs } from './llm.js'
import {
    CATEGORIES,
    extractFinishReason,
    extractLogprobs,
    type Category,
    type LogprobEntry,
} from './schema.js'
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
 * Output budget per request.
 *
 * The label itself is a handful of tokens, but reasoning models (e.g. Gemma 4)
 * spend their budget on `reasoning_content` first and only then emit the label.
 * Too small a cap cuts them off mid-thought and yields an empty answer, so the
 * budget has to cover the reasoning as well: ~130 tokens for a clear-cut text,
 * but well past 1500 for one that fits neither category — exactly the texts we
 * want a verdict on. Non-reasoning models stop on their own long before the cap.
 *
 * Raising this further buys little: a model with no fitting category can fall
 * into a repetition loop ("I'll provide no response. *Wait* …") that no budget
 * ends, and LM Studio's default 4096-token context caps the run anyway.
 */
const MAX_OUTPUT_TOKENS = 2048

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

/**
 * The run modes a report covers: once with the model's reasoning phase, once
 * without. Both are measured in the same run so the numbers are comparable.
 */
export const REASONING_MODES = [false, true] as const

/** Section heading per mode, in the console and in the report alike. */
export function reasoningLabel(reasoning: boolean): string {
    return reasoning ? 'Mit Reasoning' : 'Ohne Reasoning'
}

export type ClassificationResult = {
    method: ClassificationMethod
    /** Whether the model was allowed to think before answering. */
    reasoning: boolean
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
    /** Whether the model may think before it answers. */
    reasoning: boolean
}

/**
 * Assembles the provider-specific request body.
 *
 * Mind the two casings — they are not interchangeable. Keys the provider does
 * not know are forwarded verbatim, so those need their wire name (`logprobs`,
 * `top_logprobs`). `reasoningEffort` it does know, and maps to `reasoning_effort`
 * itself; passing the snake_case name instead drops it silently and the model
 * keeps on reasoning.
 */
function buildProviderOptions(requestLogprobs: boolean, reasoning: boolean) {
    const body: Record<string, string | number | boolean> = {}

    if (canDisableReasoning && !reasoning) body.reasoningEffort = 'none'
    if (requestLogprobs && supportsLogprobs) {
        body.logprobs = true
        body.top_logprobs = TOP_LOGPROBS
    }

    return Object.keys(body).length > 0 ? { [providerOptionsKey]: body } : {}
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
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        providerOptions: buildProviderOptions(options.requestLogprobs, options.reasoning),
        // Needed to read the provider's raw response body (where logprobs live).
        include: { responseBody: true },
    })

    const body = result.finalStep.response.body

    const sampledCategory = parseCategory(result.text)
    if (sampledCategory === undefined) {
        // An answer that never arrived looks like a wrong answer, but has a
        // different cause and a different fix — name it instead of guessing.
        if (result.text.trim().length === 0) {
            const truncated = extractFinishReason(body) === 'length'
            throw new Error(
                truncated
                    ? `Das Budget von ${MAX_OUTPUT_TOKENS} Tokens war aufgebraucht,` +
                      ' bevor eine Kategorie kam — beim Reasoning hängen geblieben.' +
                      ' Setze LLM_REASONING=false oder erhöhe MAX_OUTPUT_TOKENS.'
                    : 'Leere Antwort — das Modell hat sich auf keine Kategorie festgelegt.',
            )
        }
        throw new Error(
            `Unerwartete Antwort ${JSON.stringify(result.text)} — erwartet wurde eine von: ${CATEGORIES.join(', ')}.`,
        )
    }

    const logProbs = options.requestLogprobs ? extractLogprobs(body) : null
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
        reasoning: options.reasoning,
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
export async function classifyOnlyViaLogits(
    text: string,
    reasoning: boolean,
): Promise<ClassificationResult> {
    return classify(text, {
        method: 'logits',
        system: SYSTEM_PROMPT,
        requestLogprobs: true,
        reasoning,
    })
}

/** Classifies with the model's own confidence threshold, no logprobs involved. */
export async function classifyOnlyViaPrompt(
    text: string,
    reasoning: boolean,
): Promise<ClassificationResult> {
    return classify(text, {
        method: 'prompt',
        system: `${SYSTEM_PROMPT}\nAntworte nur, wenn du sicher bist (>${formatThreshold()}).`,
        requestLogprobs: false,
        reasoning,
    })
}