import { createGateway, extractReasoningMiddleware, wrapLanguageModel } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

type LLMProvider = 'ollama' | 'lmstudio' | 'gateway' | 'vllm'

export const provider: LLMProvider = (process.env.LLM_PROVIDER as LLMProvider) || 'lmstudio'
export const modelName = process.env.LLM_MODEL || 'lfm2-1.2b-rag'

const reasoningMiddleware = extractReasoningMiddleware({ tagName: 'think' })

/**
 * Key under which provider-specific options have to be nested in `providerOptions`.
 * For `createOpenAICompatible` this is the `name` passed to the factory; unknown
 * keys (e.g. `logprobs`) are forwarded verbatim into the request body.
 */
export const providerOptionsKey = provider

/** Backends that expose OpenAI-style `logprobs` in their chat completion response. */
export const supportsLogprobs = provider === 'lmstudio' || provider === 'vllm'

/**
 * The mode to spell out in the console (`LLM_REASONING`, default `false`).
 *
 * A run measures both modes and writes both to the report, so this only picks
 * which one also gets the per-token detail printed — dumping both in full would
 * bury the comparison. On a provider that cannot switch reasoning off it does
 * double as the one mode that runs.
 */
export const reasoningEnabled = (process.env.LLM_REASONING ?? 'false').toLowerCase() === 'true'

/**
 * Only the OpenAI-compatible backends take `reasoning_effort`; for the others
 * the switch has nothing to act on.
 */
export const canDisableReasoning = provider === 'lmstudio' || provider === 'vllm'

export function getModel() {
    switch (provider) {
        case 'gateway': {
            const gw = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY })
            return gw.languageModel(modelName)
        }
        case 'lmstudio': {
            const baseURL = process.env.LLM_PROVIDER_URL || 'http://localhost:1234/v1'
            const lmstudio = createOpenAICompatible({
                name: 'lmstudio',
                baseURL,
                supportsStructuredOutputs: true,
            })
            return lmstudio.chatModel(modelName)
        }
        case 'vllm': {
            const baseURL = process.env.LLM_PROVIDER_URL || 'http://localhost:8000/v1'
            const apiKey = process.env.RUNPOD_API_KEY
            const vllm = createOpenAICompatible({
                name: 'vllm',
                baseURL,
                supportsStructuredOutputs: true,
                ...(apiKey && { headers: { Authorization: `Bearer ${apiKey}` } }),
            })
            return wrapLanguageModel({ model: vllm.chatModel(modelName), middleware: reasoningMiddleware })
        }
        case 'ollama':
        default: {
            const baseURL = process.env.LLM_PROVIDER_URL || 'http://localhost:11434'
            const ollama = createOllama({ baseURL })
            return ollama(modelName, { options: { num_ctx: 4096 } })
        }
    }
}
