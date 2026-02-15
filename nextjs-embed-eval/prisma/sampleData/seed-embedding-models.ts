import 'dotenv/config'
import { PrismaClient } from '../../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const LLM_PROVIDER_URL = process.env.LLM_PROVIDER_URL ?? 'http://localhost:1234/v1'

const models = [
    {
        name: 'text-embedding-nomic-embed-text-v1.5',
        provider: 'lmstudio',
        providerUrl: LLM_PROVIDER_URL,
        dimensions: 768,
        description: 'Nomic Embed Text v1.5 – vielseitiges Embedding-Modell mit 768 Dimensionen',
        queryPrefix: 'search_query: ',
        documentPrefix: 'search_document: ',
    },
    {
        name: 'text-embedding-bge-m3',
        provider: 'lmstudio',
        providerUrl: LLM_PROVIDER_URL,
        dimensions: 1024,
        description: 'BAAI BGE-M3 – multilinguales Embedding-Modell mit 1024 Dimensionen',
        queryPrefix: null,
        documentPrefix: null,
    },
    {
        name: 'text-embedding-multilingual-e5-large',
        provider: 'lmstudio',
        providerUrl: LLM_PROVIDER_URL,
        dimensions: 1024,
        description: 'Microsoft Multilingual E5 Large – multilinguales Embedding-Modell mit 1024 Dimensionen',
        queryPrefix: 'query: ',
        documentPrefix: 'passage: ',
    },
]

async function main() {
    console.log('Seeding Embedding-Modelle...\n')

    for (const model of models) {
        const result = await prisma.embeddingModel.upsert({
            where: { name: model.name },
            update: {
                provider: model.provider,
                providerUrl: model.providerUrl,
                dimensions: model.dimensions,
                description: model.description,
                queryPrefix: model.queryPrefix,
                documentPrefix: model.documentPrefix,
            },
            create: model,
        })
        console.log(`  ✔ ${result.name} (${result.dimensions}d)`)
    }

    console.log(`\nFertig – ${models.length} Modelle geschrieben.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
