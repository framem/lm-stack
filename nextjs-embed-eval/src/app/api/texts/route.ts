import { NextResponse } from 'next/server'
import { getSourceTexts } from '@/src/data-access/source-texts'

export async function GET() {
    const texts = await getSourceTexts()
    return NextResponse.json(texts)
}
