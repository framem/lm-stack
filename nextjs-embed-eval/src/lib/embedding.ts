import { embed } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

export interface EmbeddingModelConfig {
    name: string
    provider: string
    providerUrl: string
    dimensions: number
}

/**
 * Create an embedding for a single text using the specified model config.
 * Model config comes from DB (EmbeddingModel table), not from .env.
 */
export async function createEmbedding(text: string, config: EmbeddingModelConfig): Promise<number[]> {
    const model = getEmbeddingModel(config)
    const { embedding } = await embed({ model, value: text })
    return embedding
}

/**
 * Create embeddings for multiple texts in batch.
 */
export async function createEmbeddings(texts: string[], config: EmbeddingModelConfig): Promise<number[][]> {
    const results: number[][] = []
    for (const text of texts) {
        const embedding = await createEmbedding(text, config)
        results.push(embedding)
    }
    return results
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
