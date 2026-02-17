import { NextResponse } from 'next/server'
import { checkLLMHealth } from '@/src/lib/health'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 *
 * Returns LLM health status for client-side polling.
 */
export async function GET() {
    const healthy = await checkLLMHealth()

    return NextResponse.json({
        healthy,
        timestamp: new Date().toISOString(),
    })
}
