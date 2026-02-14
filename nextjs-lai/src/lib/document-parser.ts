import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

export interface ParsedDocument {
    text: string
    pageCount?: number
    // Maps character offset ranges to page numbers (for PDFs)
    pageBreaks?: number[]
}

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
] as const

// Adjust this value if larger uploads are needed (e.g. 50 * 1024 * 1024 for 50 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Validate file type and size before parsing.
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'Datei ist zu gross (maximal 10 MB).' }
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
        return { valid: false, error: 'Dateityp nicht unterstützt. Erlaubt: PDF, DOCX, TXT, MD.' }
    }
    return { valid: true }
}

/**
 * Extract text content from a file based on its MIME type.
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
    const buffer = Buffer.from(await file.arrayBuffer())

    switch (file.type) {
        case 'application/pdf':
            return parsePdf(buffer)
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return parseDocx(buffer)
        case 'text/plain':
        case 'text/markdown':
            return parsePlainText(buffer)
        default:
            throw new Error('Dateityp nicht unterstützt.')
    }
}

async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()

    // v2 provides per-page text via result.pages[{text, num}]
    const pageBreaks: number[] = []
    let offset = 0
    for (const page of result.pages) {
        offset += page.text.length
        pageBreaks.push(offset)
    }

    return {
        text: result.text,
        pageCount: result.total,
        pageBreaks,
    }
}

async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
    const result = await mammoth.extractRawText({ buffer })
    return { text: result.value }
}

async function parsePlainText(buffer: Buffer): Promise<ParsedDocument> {
    return { text: buffer.toString('utf-8') }
}
