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

/**
 * Truncate an embedding to the target number of dimensions and L2-normalize the result.
 * Used for Matryoshka embeddings where a model produces full-size vectors
 * that can be truncated to smaller sizes while retaining quality.
 */
export function truncateEmbedding(embedding: number[], targetDimensions: number): number[] {
    const truncated = embedding.slice(0, targetDimensions)
    // L2-normalize: vec[i] / sqrt(sum(vec[j]^2))
    let norm = 0
    for (let i = 0; i < truncated.length; i++) {
        norm += truncated[i] * truncated[i]
    }
    norm = Math.sqrt(norm)
    if (norm === 0) return truncated
    return truncated.map(v => v / norm)
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
