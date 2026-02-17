/**
 * PDF page to PNG image conversion using pdfjs-dist + @napi-rs/canvas.
 * Everything stays in-memory — no temp files on disk.
 */
import { createCanvas } from '@napi-rs/canvas'

export interface PageImage {
    page: number
    image: Buffer
}

/**
 * Custom canvas factory so pdfjs-dist can create internal canvases
 * (needed for patterns, gradients, etc.) in a Node.js environment.
 */
class NodeCanvasFactory {
    create(width: number, height: number) {
        const canvas = createCanvas(width, height)
        const context = canvas.getContext('2d')
        return { canvas, context }
    }
    reset(pair: { canvas: { width: number; height: number } }, width: number, height: number) {
        pair.canvas.width = width
        pair.canvas.height = height
    }
    destroy() {
        // noop — @napi-rs/canvas handles its own cleanup
    }
}

/**
 * Convert specific PDF pages to PNG buffers.
 *
 * @param pdfBuffer - Raw PDF file contents
 * @param options.pages - 1-based page numbers to render (default: all)
 * @param options.dpi - Target resolution (default: 300)
 */
export async function convertPdfToImages(
    pdfBuffer: Buffer,
    options?: { pages?: number[]; dpi?: number },
): Promise<PageImage[]> {
    const dpi = options?.dpi ?? 300
    const scale = dpi / 72 // PDF base unit is 72 DPI

    // Use the legacy build — it has no browser-API dependencies
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const canvasFactory = new NodeCanvasFactory()

    // canvasFactory is needed for Node.js rendering but missing from type defs
    const doc = await pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        canvasFactory,
    } as unknown as pdfjsLib.DocumentInitParameters).promise

    const totalPages = doc.numPages
    const targetPages =
        options?.pages ?? Array.from({ length: totalPages }, (_, i) => i + 1)

    const results: PageImage[] = []

    for (const pageNum of targetPages) {
        if (pageNum < 1 || pageNum > totalPages) continue

        try {
            const page = await doc.getPage(pageNum)
            const viewport = page.getViewport({ scale })

            const canvas = createCanvas(
                Math.floor(viewport.width),
                Math.floor(viewport.height),
            )
            const context = canvas.getContext('2d')

            // canvas: null tells pdfjs to use canvasContext directly
            await page.render({
                canvas: null,
                canvasContext: context as unknown as CanvasRenderingContext2D,
                viewport,
            }).promise

            results.push({
                page: pageNum,
                image: Buffer.from(canvas.toBuffer('image/png')),
            })

            page.cleanup()
        } catch (err) {
            console.error(`Failed to render PDF page ${pageNum}:`, err)
            // Skip this page, continue with the rest
        }
    }

    await doc.cleanup()

    return results
}
