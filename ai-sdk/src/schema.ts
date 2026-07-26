import { z } from 'zod'

/** The classification target: every user text maps to exactly one of these. */
export const CATEGORIES = ['Lebensmittel', 'Werkzeug'] as const

export const CategorySchema = z.enum(CATEGORIES)
export type Category = z.infer<typeof CategorySchema>

/**
 * Raw OpenAI-compatible logprobs payload.
 *
 * The AI SDK does not surface logprobs in a normalised shape, so we validate the
 * provider's raw response body (`result.response.body`) ourselves.
 */
const TokenLogprobSchema = z.object({
    token: z.string(),
    logprob: z.number(),
})

const LogprobEntrySchema = TokenLogprobSchema.extend({
    top_logprobs: z.array(TokenLogprobSchema).nullish(),
})

export type LogprobEntry = z.infer<typeof LogprobEntrySchema>

const ChatCompletionSchema = z.object({
    choices: z
        .array(
            z.object({
                logprobs: z
                    .object({ content: z.array(LogprobEntrySchema).nullish() })
                    .nullish(),
            }),
        )
        .min(1),
})

/**
 * Pulls the per-token logprobs out of a raw chat completion body.
 * Returns `null` when the backend did not send any (e.g. Ollama, or an LM Studio
 * runtime that has logprobs disabled).
 */
export function extractLogprobs(body: unknown): LogprobEntry[] | null {
    const parsed = ChatCompletionSchema.safeParse(body)
    if (!parsed.success) return null
    return parsed.data.choices[0].logprobs?.content ?? null
}
