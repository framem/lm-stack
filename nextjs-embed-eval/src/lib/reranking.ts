export interface RerankResult {
    index: number
    score: number
}

export interface RerankerConfig {
    provider: string      // "lmstudio" | "ollama"
    providerUrl: string
    modelName: string
}

/**
 * Score a single (query, document) pair using a prompt-based approach.
 * The model rates relevance on a scale of 0-10.
 */
async function scoreDocument(
    query: string,
    document: string,
    config: RerankerConfig
): Promise<number> {
    const systemPrompt = `You are a relevance scoring system. Rate how relevant a document is to a given query on a scale from 0 to 10, where 0 means completely irrelevant and 10 means perfectly relevant. Respond with ONLY a single number (0-10), nothing else.`

    const userPrompt = `Query: ${query}\n\nDocument: ${document}\n\nRelevance score (0-10):`

    if (config.provider === 'ollama') {
        const response = await fetch(`${config.providerUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.modelName,
                prompt: `${systemPrompt}\n\n${userPrompt}`,
                stream: false,
                options: { temperature: 0 },
            }),
        })

        if (!response.ok) {
            throw new Error(`Ollama reranking failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return parseScore(data.response)
    }

    // LM Studio (OpenAI-compatible)
    const response = await fetch(`${config.providerUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: config.modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0,
            max_tokens: 10,
        }),
    })

    if (!response.ok) {
        throw new Error(`LM Studio reranking failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return parseScore(data.choices?.[0]?.message?.content ?? '')
}

/**
 * Parse a numeric score (0-10) from model output.
 * Falls back to 0 if no valid number is found.
 */
function parseScore(text: string): number {
    const trimmed = text.trim()
    const match = trimmed.match(/(\d+(?:\.\d+)?)/)
    if (!match) return 0
    const score = parseFloat(match[1])
    return Math.min(10, Math.max(0, score))
}

/**
 * Rerank documents by scoring each (query, document) pair with a cross-encoder model.
 * Returns results sorted by score descending.
 */
export async function rerank(
    query: string,
    documents: string[],
    config: RerankerConfig
): Promise<RerankResult[]> {
    // Normalize provider URL (trim trailing slashes)
    const normalizedConfig = { ...config, providerUrl: config.providerUrl.replace(/\/+$/, '') }

    // Score all documents in parallel for better latency
    const scores = await Promise.all(
        documents.map(doc => scoreDocument(query, doc, normalizedConfig).catch(() => 0))
    )

    const results: RerankResult[] = scores.map((score, index) => ({ index, score }))

    // Sort by score descending
    results.sort((a, b) => b.score - a.score)
    return results
}
