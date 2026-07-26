import 'dotenv/config'
import {
    classifyOnlyViaLogits,
    classifyOnlyViaPrompt,
    formatThreshold,
    METHOD_LABELS,
    METHODS,
    type ClassificationMethod,
    type ClassificationResult,
} from './classify.js'
import { modelName, provider, supportsLogprobs } from './llm.js'
import { matchCategory, toProbability } from './probabilities.js'
import type { Category } from './schema.js'

/** Sample texts with their known category, so a run doubles as a smoke test. */
const DEFAULT_TEXTS: Array<{ text: string; expected: Category }> = [
    { text: 'Ein reifer Apfel', expected: 'Lebensmittel' },
    { text: 'Ein Schraubenzieher', expected: 'Werkzeug' },
    { text: 'Sauerteigbrot', expected: 'Lebensmittel' },
    { text: 'Eine Bohrmaschine', expected: 'Werkzeug' },
    { text: 'Ein Laib Roggenbrot', expected: 'Lebensmittel' },
    { text: 'Eine Wasserwaage', expected: 'Werkzeug' },
]

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

function printResult(result: ClassificationResult, expected?: Category): void {
    console.log(`\n── ${METHOD_LABELS[result.method]} ──`)
    console.log(`Text:      ${result.text}`)

    const verdict =
        expected === undefined
            ? ''
            : result.category === expected
              ? '  ✓'
              : `  ✗ erwartet: ${expected}`
    console.log(`Kategorie: ${result.category}${verdict}`)

    if (result.confidence !== null) {
        const threshold = result.confident
            ? `über Schwelle ${formatThreshold()}`
            : `unter Schwelle ${formatThreshold()} → unsicher`
        console.log(`Konfidenz:${formatPercent(result.confidence)}  (${threshold})`)
    }

    if (result.probabilities) {
        console.log(`Verteilung: ${JSON.stringify(result.probabilities)}`)
    }

    if (result.distribution) {
        const { token, probabilities } = result.distribution
        console.log(
            `\n  Kategorie-Wahrscheinlichkeiten (Entscheidungs-Token ${formatToken(token)}):`,
        )
        for (const { category, probability } of probabilities) {
            const bar = '█'.repeat(Math.round(probability * 30))
            console.log(`    ${category.padEnd(14)} ${formatPercent(probability)}  ${bar}`)
        }
    }

    if (result.method === 'prompt') {
        // This variant deliberately never asks for logprobs — it only prompts.
        console.log(
            `\n  Ohne Logprobs — die Schwelle von ${formatThreshold()} steckt allein in der Prompt-Vorgabe.`,
        )
        return
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

/** A run either yields a result or fails — the table must survive both. */
type Outcome =
    | { ok: true; result: ClassificationResult }
    | { ok: false; message: string }

const CLASSIFIERS: Record<
    ClassificationMethod,
    (text: string) => Promise<ClassificationResult>
> = {
    logits: classifyOnlyViaLogits,
    prompt: classifyOnlyViaPrompt,
}

async function run(
    method: ClassificationMethod,
    text: string,
): Promise<Outcome> {
    try {
        return { ok: true, result: await CLASSIFIERS[method](text) }
    } catch (error: unknown) {
        return { ok: false, message: error instanceof Error ? error.message : String(error) }
    }
}

/** One table cell: the predicted category, its verdict and — if known — its confidence. */
function formatCell(outcome: Outcome, expected?: Category): string {
    if (!outcome.ok) return '– Fehler'

    const { category, confidence, confident } = outcome.result
    const verdict = expected === undefined ? ' ' : category === expected ? '✓' : '✗'
    if (confidence === null) return `${category} ${verdict}`

    // ⚠ flags a label the measured distribution does not actually support.
    return `${category} ${verdict} ${(confidence * 100).toFixed(1)} %${confident ? '' : ' ⚠'}`
}

/** Prints rows as a fixed-width table, sizing every column to its widest cell. */
function printTable(header: string[], rows: string[][]): void {
    const widths = header.map((cell, column) =>
        Math.max(cell.length, ...rows.map((row) => row[column].length)),
    )
    const line = (cells: string[]) =>
        cells.map((cell, column) => cell.padEnd(widths[column])).join('  ').trimEnd()

    console.log(line(header))
    console.log(widths.map((width) => '─'.repeat(width)).join('  '))
    for (const row of rows) console.log(line(row))
}

async function main(): Promise<void> {
    const args = process.argv.slice(2)
    // Texts from the command line have no known category to check against.
    const inputs: Array<{ text: string; expected?: Category }> =
        args.length > 0 ? args.map((text) => ({ text })) : DEFAULT_TEXTS

    console.log(`Provider: ${provider}   Modell: ${modelName}`)
    if (args.length === 0) {
        console.log('Keine Eingabe übergeben — nutze Beispieltexte.')
        console.log('Aufruf: npm run classify -- "Dein Text"')
    }

    const hits: Record<ClassificationMethod, number> = { logits: 0, prompt: 0 }
    const unsure: Record<ClassificationMethod, number> = { logits: 0, prompt: 0 }
    const rows: string[][] = []
    let checked = 0

    for (const input of inputs) {
        console.log(`\n${'='.repeat(60)}`)

        const outcomes: Record<ClassificationMethod, Outcome> = {
            // Sequential on purpose: a local backend serves one request at a time.
            logits: await run('logits', input.text),
            prompt: await run('prompt', input.text),
        }

        for (const method of METHODS) {
            const outcome = outcomes[method]
            if (outcome.ok) {
                if (outcome.result.confident === false) unsure[method] += 1
                printResult(outcome.result, input.expected)
            } else {
                console.log(`\n── ${METHOD_LABELS[method]} ──`)
                console.log(`Fehler: ${outcome.message}`)
            }
        }

        if (input.expected !== undefined) {
            checked += 1
            for (const method of METHODS) {
                const outcome = outcomes[method]
                if (outcome.ok && outcome.result.category === input.expected) hits[method] += 1
            }
        }

        rows.push([
            input.text,
            input.expected ?? '—',
            ...METHODS.map((method) => formatCell(outcomes[method], input.expected)),
        ])
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log('\nVergleich\n')
    printTable(
        ['Text', 'Erwartet', ...METHODS.map((method) => METHOD_LABELS[method])],
        rows,
    )

    if (checked > 0) {
        console.log('\nTrefferquote:')
        for (const method of METHODS) {
            const rate = ((hits[method] / checked) * 100).toFixed(0)
            const flagged =
                unsure[method] > 0
                    ? `  — davon ${unsure[method]} unter Schwelle ${formatThreshold()} ⚠`
                    : ''
            console.log(
                `  ${METHOD_LABELS[method].padEnd(8)} ${hits[method]}/${checked} (${rate} %)${flagged}`,
            )
        }
    }
}

main().catch((error: unknown) => {
    console.error('\nFehler bei der Klassifikation:')
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
})
