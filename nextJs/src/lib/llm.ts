import { createGateway } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

type LLMProvider = 'ollama' | 'lmstudio' | 'gateway'

const provider: LLMProvider = (process.env.LLM_PROVIDER as LLMProvider) || 'lmstudio'
const modelName = process.env.LLM_MODEL || 'qwen3:8b'

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
