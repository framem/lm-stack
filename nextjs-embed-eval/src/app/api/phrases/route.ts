import { NextResponse } from 'next/server'
import { getTestPhrases } from '@/src/data-access/test-phrases'

export async function GET() {
    const phrases = await getTestPhrases()
    return NextResponse.json(phrases)
}
