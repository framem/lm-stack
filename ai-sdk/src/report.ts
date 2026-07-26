import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { formatThreshold, reasoningLabel, METHOD_LABELS, METHODS } from './classify.js'
import type { ClassificationMethod } from './classify.js'
import type { Category } from './schema.js'

/** Where the reports go, relative to the project root. */
const OUTPUT_DIR = 'dist'

/** What a single run measured for one mode, ready to be written out. */
export type ModeReport = {
    reasoning: boolean
    /** Wall-clock time of the whole mode, in milliseconds. */
    durationMs: number
    /** Correct predictions per method, over the texts with a known category. */
    hits: Record<ClassificationMethod, number>
    /** Predictions below the confidence threshold, per method. */
    unsure: Record<ClassificationMethod, number>
    /** Requests that produced no usable answer, per method. */
    failures: Record<ClassificationMethod, number>
    /** Number of texts with a known category — the denominator for `hits`. */
    checked: number
    rows: ReportRow[]
}

/** One text and what each method made of it. */
export type ReportRow = {
    text: string
    expected?: Category
    cells: Record<ClassificationMethod, ReportCell>
}

export type ReportCell =
    | { ok: true; category: Category; correct: boolean | null; confidence: number | null }
    | { ok: false; message: string }

export type RunReport = {
    provider: string
    model: string
    date: Date
    modes: ModeReport[]
}

/**
 * Turns a model id into a file name: `google/gemma-4-12b-qat` becomes
 * `gemma-4-12b-qat.md`. The publisher prefix carries no information the file
 * name needs, and `/` would open a directory nobody asked for.
 */
export function reportFileName(model: string): string {
    const base = model.split('/').pop() ?? model
    const slug = base.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
    return `${slug || 'modell'}.md`
}

/** Local calendar date as `YYYY-MM-DD` — `toISOString` would shift the day. */
export function formatDate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatTime(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDuration(ms: number): string {
    const seconds = ms / 1000
    if (seconds < 60) return `${seconds.toFixed(1)} s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min ${(seconds - minutes * 60).toFixed(0)} s`
}

/** Escapes the one character that would break a Markdown table row. */
function escapeCell(value: string): string {
    return value.replace(/\|/g, '\\|')
}

function formatCell(cell: ReportCell): string {
    if (!cell.ok) return '– Fehler'

    const verdict = cell.correct === null ? '' : cell.correct ? ' ✓' : ' ✗'
    if (cell.confidence === null) return `${cell.category}${verdict}`
    return `${cell.category}${verdict} · ${(cell.confidence * 100).toFixed(1)} %`
}

function renderMode(mode: ModeReport): string {
    const lines: string[] = [`### ${reasoningLabel(mode.reasoning)}`, '']

    // Texts passed on the command line carry no expected category, so there is
    // nothing to score — the table alone is the result then.
    if (mode.checked > 0) {
        const summary = METHODS.map((method) => {
            const rate = ((mode.hits[method] / mode.checked) * 100).toFixed(0)
            return `${METHOD_LABELS[method]} ${mode.hits[method]}/${mode.checked} (${rate} %)`
        }).join(' · ')
        lines.push(`Trefferquote: ${summary}`, '')
    }
    lines.push(`Laufzeit: ${formatDuration(mode.durationMs)}`, '')

    const flagged = METHODS.filter((method) => mode.unsure[method] > 0 || mode.failures[method] > 0)
    if (flagged.length > 0) {
        const notes = flagged.map((method) => {
            const parts: string[] = []
            if (mode.unsure[method] > 0) parts.push(`${mode.unsure[method]}× unter ${formatThreshold()}`)
            if (mode.failures[method] > 0) parts.push(`${mode.failures[method]}× ohne Antwort`)
            return `${METHOD_LABELS[method]}: ${parts.join(', ')}`
        })
        lines.push(`Auffällig: ${notes.join(' · ')}`, '')
    }

    lines.push(`| Text | Erwartet | ${METHODS.map((m) => METHOD_LABELS[m]).join(' | ')} |`)
    lines.push(`| --- | --- | ${METHODS.map(() => '---').join(' | ')} |`)
    for (const row of mode.rows) {
        const cells = METHODS.map((method) => escapeCell(formatCell(row.cells[method])))
        lines.push(`| ${escapeCell(row.text)} | ${row.expected ?? '—'} | ${cells.join(' | ')} |`)
    }

    lines.push('')
    return lines.join('\n')
}

/** Renders one run as the dated `##` section it occupies in the model's file. */
function renderRun(report: RunReport): string {
    const lines: string[] = [
        `## ${formatDate(report.date)}`,
        '',
        `Provider \`${report.provider}\` · Modell \`${report.model}\` · ${formatTime(report.date)} Uhr`,
        '',
    ]
    for (const mode of report.modes) lines.push(renderMode(mode))
    return lines.join('\n')
}

/**
 * Splits a file into its dated `## ` sections, so a re-run on the same day
 * replaces that day's section instead of piling a second one on top of it.
 */
function withoutSection(body: string, heading: string): string[] {
    const sections: string[] = []
    let current: string[] | null = null

    for (const line of body.split('\n')) {
        if (line.startsWith('## ')) {
            if (current) sections.push(current.join('\n'))
            current = [line]
        } else if (current) {
            current.push(line)
        }
    }
    if (current) sections.push(current.join('\n'))

    return sections.filter((section) => !section.startsWith(`## ${heading}`))
}

/**
 * Writes the run into `dist/<modell>.md`, newest run first.
 *
 * Existing runs are kept, so the file grows into a history for that model —
 * except a run from the same day, which is replaced rather than duplicated.
 */
export async function writeReport(report: RunReport, cwd = process.cwd()): Promise<string> {
    const file = path.join(cwd, OUTPUT_DIR, reportFileName(report.model))
    await mkdir(path.dirname(file), { recursive: true })

    const previous = await readFile(file, 'utf8').catch(() => '')
    const kept = withoutSection(previous, formatDate(report.date))

    const content = [
        `# ${report.model}`,
        '',
        'Klassifikation der Beispieltexte, je einmal mit und ohne Reasoning.',
        'Erzeugt von `npm run classify`.',
        '',
        renderRun(report),
        ...kept.map((section) => section.trimEnd() + '\n'),
    ].join('\n')

    await writeFile(file, content.trimEnd() + '\n', 'utf8')
    return file
}
