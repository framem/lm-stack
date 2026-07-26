import { generateText, Output } from 'ai'
import { getModel, providerOptionsKey, supportsLogprobs } from './llm.js'
import {
    CATEGORIES,
    CategorySchema,
    extractLogprobs,
    type Category,
    type LogprobEntry,
} from './schema.js'
import { deriveCategoryDistribution, type CategoryDistribution } from './probabilities.js'

const SYSTEM_PROMPT = [
    'Du bist ein Klassifikator.',
    `Ordne den Text des Nutzers genau einer dieser Kategorien zu: ${CATEGORIES.join(', ')}.`,
    'Antworte ausschließlich mit der Kategorie, ohne Begründung.',
].join(' ')

/** How many alternative tokens the backend should report per position. */
const TOP_LOGPROBS = 5

export type ClassificationResult = {
    text: string
    category: Category
    /** Per-token logprobs of the completion, or `null` if unsupported. */
    logProbs: LogprobEntry[] | null
    /** Category probabilities derived from the logprobs, or `null`. */
    distribution: CategoryDistribution | null
}

export async function classify(text: string): Promise<ClassificationResult> {
    const result = await generateText({
        model: getModel(),
        system: SYSTEM_PROMPT,
        prompt: text,
        // Constrains the model to one of the labels and validates the answer.
        output: Output.choice({ options: [...CATEGORIES] }),
        temperature: 0,
        maxOutputTokens: 64,
        // Unknown keys are forwarded verbatim into the OpenAI-compatible body,
        // so snake_case is required here.
        providerOptions: supportsLogprobs
            ? { [providerOptionsKey]: { logprobs: true, top_logprobs: TOP_LOGPROBS } }
            : {},
        // Needed to read the provider's raw response body (where logprobs live).
        include: { responseBody: true },
    })

    const logProbs = extractLogprobs(result.response.body)

    return {
        text,
        // Output.choice already narrows the type; Zod re-validates at the boundary.
        category: CategorySchema.parse(result.output),
        logProbs: logProbs,
        distribution: logProbs ? deriveCategoryDistribution(logProbs) : null,
    }
}
