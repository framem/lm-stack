// Check if the LLM provider is reachable
export async function checkLLMHealth(): Promise<boolean> {
    const provider = process.env.LLM_PROVIDER || 'lmstudio'
    let baseURL: string

    switch (provider) {
        case 'gateway':
            // Gateway providers are cloud-hosted, skip health check
            return true
        case 'lmstudio':
            baseURL = process.env.LLM_PROVIDER_URL || 'http://localhost:1234/v1'
            break
        case 'ollama':
        default:
            baseURL = process.env.LLM_PROVIDER_URL || 'http://localhost:11434'
            break
    }

    try {
        const url = provider === 'ollama' ? baseURL : baseURL.replace(/\/v1\/?$/, '')
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
        return res.ok
    } catch {
        return false
    }
}
