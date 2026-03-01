import { createGateway, embed, embedMany } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { E5_PREFIX, EMBEDDING_CONFIG, CHARS_PER_TOKEN } from '@/src/lib/rag-config'

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

export function getVisionModel() {
    const visionModelName = process.env.VISION_MODEL
    if (!visionModelName) return null

    const visionProv: LLMProvider = (process.env.VISION_PROVIDER as LLMProvider) || provider
    const visionProvUrl = process.env.VISION_PROVIDER_URL || process.env.LLM_PROVIDER_URL

    switch (visionProv) {
        case 'gateway': {
            const gw = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY })
            return gw.languageModel(visionModelName)
        }
        case 'lmstudio': {
            const baseURL = visionProvUrl || 'http://localhost:1234/v1'
            const lmstudio = createOpenAICompatible({ name: 'lmstudio', baseURL })
            return lmstudio.chatModel(visionModelName)
        }
        case 'ollama':
        default: {
            const baseURL = visionProvUrl || 'http://localhost:11434'
            const ollama = createOllama({ baseURL })
            return ollama(visionModelName)
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

// ── L2 normalization for cosine-similarity storage ──

function normalizeL2(vec: number[]): number[] {
    let norm = 0
    for (const v of vec) norm += v * v
    norm = Math.sqrt(norm)
    if (norm === 0) return vec
    return vec.map(v => v / norm)
}

// ── Truncation safety net ──
// Ensures text + prefix stays within the embedding model's token limit.

const MAX_CONTENT_CHARS = Math.floor(
    (EMBEDDING_CONFIG.maxModelTokens - 10) * CHARS_PER_TOKEN // 10 token buffer for prefix + special tokens
)

function truncateForEmbedding(text: string): string {
    if (text.length <= MAX_CONTENT_CHARS) return text
    // Cut at last space before limit to avoid splitting words
    const cut = text.lastIndexOf(' ', MAX_CONTENT_CHARS)
    return cut > 0 ? text.slice(0, cut) : text.slice(0, MAX_CONTENT_CHARS)
}

// ── E5 prefix helpers ──
// multilingual-e5-large requires "query: " / "passage: " prefixes.

function prefixQuery(text: string): string {
    return E5_PREFIX.query + truncateForEmbedding(text)
}

function prefixPassage(text: string): string {
    return E5_PREFIX.passage + truncateForEmbedding(text)
}

/**
 * Embed a single query (retrieval time) — applies "query: " prefix.
 */
export async function createEmbedding(text: string): Promise<number[]> {
    const model = getEmbeddingModel()
    const { embedding } = await embed({ model, value: prefixQuery(text) })
    return normalizeL2(embedding)
}

/**
 * Embed multiple passages (indexing time) — applies "passage: " prefix.
 */
export async function createEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []
    const model = getEmbeddingModel()
    const { embeddings } = await embedMany({ model, values: texts.map(prefixPassage) })
    return embeddings.map(normalizeL2)
}

const EMBEDDING_BATCH_SIZE = 32

/**
 * Process passage embeddings in smaller batches, calling onProgress after each batch.
 * Applies "passage: " prefix and L2 normalization.
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
        const { embeddings } = await embedMany({ model, values: slice.map(prefixPassage) })
        allEmbeddings.push(...embeddings.map(normalizeL2))
        onProgress(Math.min(i + EMBEDDING_BATCH_SIZE, texts.length), texts.length)
    }

    return allEmbeddings
}
