import { createGateway, embed } from 'ai'
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
            const lmstudio = createOpenAICompatible({ name: 'lmstudio', baseURL })
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
