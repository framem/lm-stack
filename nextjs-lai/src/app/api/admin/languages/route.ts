import { NextRequest, NextResponse } from 'next/server'
import { languageSets, getLanguageSet } from '@/src/data/language-sets'
import { createDocument, getDocuments, deleteDocument } from '@/src/data-access/documents'
import { createFlashcards } from '@/src/data-access/flashcards'

// GET — list all language sets with import status
export async function GET() {
    const docs = await getDocuments()

    const sets = languageSets.map(set => {
        const doc = docs.find(d => d.title === set.title && d.fileType === 'language-set')
        const totalItems = set.categories.reduce((sum, cat) => sum + cat.items.length, 0)
        return {
            id: set.id,
            title: set.title,
            subject: set.subject,
            description: set.description,
            level: set.level,
            categoryCount: set.categories.length,
            itemCount: totalItems,
            imported: !!doc,
            documentId: doc?.id ?? null,
            importedFlashcardCount: doc ? (doc as { _count?: { flashcards?: number } })._count?.flashcards ?? null : null,
        }
    })

    return NextResponse.json({ sets })
}

// POST — import a language set
export async function POST(req: NextRequest) {
    const body = await req.json()
    const { setId } = body as { setId: string }

    const set = getLanguageSet(setId)
    if (!set) {
        return NextResponse.json({ error: 'Unbekanntes Vokabelset' }, { status: 400 })
    }

    // Check if already imported
    const docs = await getDocuments()
    const existing = docs.find(d => d.title === set.title && d.fileType === 'language-set')
    if (existing) {
        return NextResponse.json({ error: 'Bereits importiert' }, { status: 409 })
    }

    // Build content summary for the document
    const totalItems = set.categories.reduce((sum, cat) => sum + cat.items.length, 0)
    const content = `${set.title} — ${set.level}\n${set.description}\n\n${set.categories.length} Kategorien, ${totalItems} Vokabeln`

    // Create the document
    const doc = await createDocument({
        title: set.title,
        fileType: 'language-set',
        content,
        subject: set.subject,
        tags: [set.level, 'Vokabeln', set.subject],
    })

    // Build flashcard data from all categories
    const flashcardData = set.categories.flatMap(category =>
        category.items.map(item => ({
            documentId: doc.id,
            front: item.front,
            back: item.back,
            context: category.name,
            isVocabulary: true,
            exampleSentence: item.exampleSentence ?? undefined,
            partOfSpeech: item.partOfSpeech,
            conjugation: item.conjugation ?? undefined,
        }))
    )

    await createFlashcards(flashcardData)

    return NextResponse.json({
        success: true,
        documentId: doc.id,
        flashcardCount: flashcardData.length,
    })
}

// DELETE — remove an imported language set
export async function DELETE(req: NextRequest) {
    const body = await req.json()
    const { setId } = body as { setId: string }

    const set = getLanguageSet(setId)
    if (!set) {
        return NextResponse.json({ error: 'Unbekanntes Vokabelset' }, { status: 400 })
    }

    // Find the imported document
    const docs = await getDocuments()
    const doc = docs.find(d => d.title === set.title && d.fileType === 'language-set')
    if (!doc) {
        return NextResponse.json({ error: 'Nicht importiert' }, { status: 404 })
    }

    // Delete cascades to flashcards via Prisma relation
    await deleteDocument(doc.id)

    return NextResponse.json({ success: true })
}
