import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { prisma } from '@/src/lib/prisma'

export interface ScannedFile {
    relativePath: string
    fileName: string
    sizeBytes: number
    category: 'docs' | 'notebooks'
    alreadyImported: boolean
}

const LM_BASE = path.resolve(process.cwd(), '..', 'machineLearning', 'languageModel')

const IMPORTABLE_EXTENSIONS = ['.md', '.ipynb']

async function findImportableFiles(dir: string, base: string): Promise<{ relativePath: string; fileName: string; sizeBytes: number }[]> {
    const results: { relativePath: string; fileName: string; sizeBytes: number }[] = []

    let entries: import('fs').Dirent[]
    try {
        entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
        return results
    }

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            // Skip node_modules, __pycache__, .git, dist
            if (['node_modules', '__pycache__', '.git', 'dist'].includes(entry.name)) continue
            results.push(...await findImportableFiles(fullPath, base))
        } else if (entry.isFile() && IMPORTABLE_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
            const stat = await fs.stat(fullPath)
            results.push({
                relativePath: path.relative(base, fullPath).replace(/\\/g, '/'),
                fileName: entry.name,
                sizeBytes: stat.size,
            })
        }
    }

    return results
}

// GET /api/admin/scan - Scan local markdown files
export async function GET() {
    try {
        // Check if base directory exists
        try {
            await fs.access(LM_BASE)
        } catch {
            return NextResponse.json(
                { error: `Verzeichnis nicht gefunden: ${LM_BASE}` },
                { status: 404 }
            )
        }

        const files = await findImportableFiles(LM_BASE, LM_BASE)

        // Get already imported file names from DB
        const existingDocs = await prisma.document.findMany({
            select: { fileName: true },
        })
        const importedNames = new Set(existingDocs.map(d => d.fileName).filter(Boolean))

        const scannedFiles: ScannedFile[] = files.map(f => ({
            ...f,
            category: f.relativePath.startsWith('notebooks/') ? 'notebooks' : 'docs',
            alreadyImported: importedNames.has(f.fileName),
        }))

        // Sort: docs first, then notebooks; within each group alphabetically
        scannedFiles.sort((a, b) => {
            if (a.category !== b.category) return a.category === 'docs' ? -1 : 1
            return a.fileName.localeCompare(b.fileName)
        })

        return NextResponse.json({ files: scannedFiles, basePath: LM_BASE })
    } catch (error) {
        console.error('Scan error:', error)
        return NextResponse.json(
            { error: 'Scan fehlgeschlagen.' },
            { status: 500 }
        )
    }
}
