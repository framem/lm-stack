import 'dotenv/config'
import { classify, type ClassificationResult } from './classify.js'
import { modelName, provider, supportsLogprobs } from './llm.js'
import { matchCategory, toProbability } from './probabilities.js'

const DEFAULT_TEXTS = ['Ein reifer Apfel', 'Ein Schraubenzieher', 'Sauerteigbrot']

function formatPercent(probability: number): string {
    return `${(probability * 100).toFixed(2).padStart(6)} %`
}

/** Renders a token as a single visible line (whitespace and newlines escaped). */
function formatToken(token: string): string {
    return JSON.stringify(token)
}

/** Annotates a token with the category its prefix unambiguously identifies. */
function formatMatch(token: string): string {
    const category = matchCategory(token)
    return category === null ? '' : `  → ${category}`
}

function printResult(result: ClassificationResult): void {
    console.log(`\nText:      ${result.text}`)
    console.log(`Kategorie: ${result.category}`)

    if (result.probabilities) {
        console.log(`Verteilung: ${JSON.stringify(result.probabilities)}`)
    }

    if (result.distribution) {
        const { token, tokenIndex, probabilities } = result.distribution
        console.log(
            `\n  Kategorie-Wahrscheinlichkeiten (Entscheidungs-Token #${tokenIndex} = ${formatToken(token)}):`,
        )
        for (const { category, probability } of probabilities) {
            const bar = '█'.repeat(Math.round(probability * 30))
            console.log(`    ${category.padEnd(14)} ${formatPercent(probability)}  ${bar}`)
        }
    }

    if (!result.logProbs) {
        console.log(
            supportsLogprobs
                ? '\n  Keine Logprobs erhalten — das geladene Modell bzw. die Runtime unterstützt sie nicht.'
                : `\n  Keine Logprobs — Provider "${provider}" liefert keine logprobs. Nutze lmstudio oder vllm.`,
        )
        return
    }

    // The tokens concatenated are exactly what the model emitted.
    const rawText = result.logProbs.map((entry) => entry.token).join('')
    console.log(`\n  Rohtext des Modells: ${formatToken(rawText)}`)

    console.log('\n  Token-Logprobs der Antwort:')
    for (const [index, entry] of result.logProbs.entries()) {
        console.log(
            `    #${String(index).padEnd(2)} ${formatToken(entry.token).padEnd(16)}` +
                ` logprob ${entry.logprob.toFixed(4).padStart(9)}  p = ${formatPercent(toProbability(entry.logprob))}` +
                formatMatch(entry.token),
        )
        for (const alternative of entry.top_logprobs ?? []) {
            if (alternative.token === entry.token) continue
            console.log(
                `         ↳ ${formatToken(alternative.token).padEnd(16)}` +
                    ` logprob ${alternative.logprob.toFixed(4).padStart(9)}  p = ${formatPercent(toProbability(alternative.logprob))}` +
                    formatMatch(alternative.token),
            )
        }
    }
}

async function main(): Promise<void> {
    const texts = process.argv.slice(2)
    const inputs = texts.length > 0 ? texts : DEFAULT_TEXTS

    console.log(`Provider: ${provider}   Modell: ${modelName}`)
    if (texts.length === 0) {
        console.log('Keine Eingabe übergeben — nutze Beispieltexte.')
        console.log('Aufruf: npm run classify -- "Dein Text"')
    }

    for (const text of inputs) {
        printResult(await classify(text))
    }
}

main().catch((error: unknown) => {
    console.error('\nFehler bei der Klassifikation:')
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
})
