import { createGateway, embed, embedMany } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

type LLMProvider = 'ollama' | 'lmstudio' | 'gateway'

const provider: LLMProvider = (process.env.LLM_PROVIDER as LLMProvider) || 'lmstudio'
const modelName = process.env.LLM_MODEL || 'qwen3:8b'

const embeddingProvider: LLMProvider = (process.env.EMBEDDING_PROVIDER as LLMProvider) || provider
const embeddingModelName = process.env.EMBEDDING_MODEL || 'no-embedding-model-provided'
const embeddingProviderUrl = process.env.EMBEDDING_PROVIDER_URL || process.env.LLM_PROVIDER_URL

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
        case 'ollama':
        default: {
            const baseURL = process.env.LLM_PROVIDER_URL || 'http://localhost:11434'
            const ollama = createOllama({ baseURL })
            return ollama(modelName, { options: { num_ctx: 4096 } })
        }
    }
}

export function getEmbeddingModel() {
    switch (embeddingProvider) {
        case 'gateway': {
            const gw = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY })
            return gw.embeddingModel(embeddingModelName)
        }
        case 'lmstudio': {
            const baseURL = embeddingProviderUrl || 'http://localhost:1234/v1'
            const lmstudio = createOpenAICompatible({ name: 'lmstudio', baseURL })
            return lmstudio.embeddingModel(embeddingModelName)
        }
        case 'ollama':
        default: {
            const baseURL = embeddingProviderUrl || 'http://localhost:11434'
            const ollama = createOllama({ baseURL })
            return ollama.embedding(embeddingModelName)
        }
    }
}

export async function createEmbedding(text: string): Promise<number[]> {
    const model = getEmbeddingModel()
    const { embedding } = await embed({ model, value: text })
    return embedding
}

export async function createEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []
    const model = getEmbeddingModel()
    const { embeddings } = await embedMany({ model, values: texts })
    return embeddings
}

const EMBEDDING_BATCH_SIZE = 50

/**
 * Process embeddings in smaller batches, calling onProgress after each batch.
 * Returns the full array of embeddings in the original order.
 */
export async function createEmbeddingsBatchWithProgress(
    texts: string[],
    onProgress: (done: number, total: number) => void,
): Promise<number[][]> {
    if (texts.length === 0) return []
    const model = getEmbeddingModel()
    const allEmbeddings: number[][] = []

    for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
        const slice = texts.slice(i, i + EMBEDDING_BATCH_SIZE)
        const { embeddings } = await embedMany({ model, values: slice })
        allEmbeddings.push(...embeddings)
        onProgress(Math.min(i + EMBEDDING_BATCH_SIZE, texts.length), texts.length)
    }

    return allEmbeddings
}
