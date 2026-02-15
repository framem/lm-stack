import { embed, embedMany } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

export interface EmbeddingModelConfig {
    name: string
    provider: string
    providerUrl: string
    dimensions: number
    queryPrefix?: string | null
    documentPrefix?: string | null
}

export type EmbedContext = 'query' | 'document'

/**
 * Apply the appropriate prefix based on context (query vs. document).
 * Many models (E5, Nomic, etc.) require different prefixes for queries and documents.
 */
function applyPrefix(text: string, config: EmbeddingModelConfig, context: EmbedContext): string {
    const prefix = context === 'query' ? config.queryPrefix : config.documentPrefix
    if (prefix) return prefix + text
    return text
}

/**
 * Create an embedding for a single text using the specified model config.
 */
export async function createEmbedding(
    text: string,
    config: EmbeddingModelConfig,
    context: EmbedContext = 'document'
): Promise<number[]> {
    const model = getEmbeddingModel(config)
    const { embedding } = await embed({ model, value: applyPrefix(text, config, context) })
    return embedding
}

/**
 * Create embeddings for multiple texts in batch.
 */
export async function createEmbeddings(
    texts: string[],
    config: EmbeddingModelConfig,
    context: EmbedContext = 'document'
): Promise<number[][]> {
    const model = getEmbeddingModel(config)
    const prefixed = texts.map(t => applyPrefix(t, config, context))
    const { embeddings } = await embedMany({ model, values: prefixed })
    return embeddings
}

function getEmbeddingModel(config: EmbeddingModelConfig) {
    switch (config.provider) {
        case 'lmstudio': {
            const lmstudio = createOpenAICompatible({
                name: 'lmstudio',
                baseURL: config.providerUrl || 'http://localhost:1234/v1',
            })
            return lmstudio.embeddingModel(config.name)
        }
        case 'ollama':
        default: {
            const ollama = createOllama({
                baseURL: config.providerUrl || 'http://localhost:11434',
            })
            return ollama.embedding(config.name)
        }
    }
}
