import { NextResponse } from 'next/server'
import { refreshAllExpiringTokens } from '@/lib/instagram/token-refresh'

/**
 * Vercel Cron endpoint for automatic token refresh
 * Called daily by Vercel Cron (GET method)
 * Refreshes all Instagram Login tokens expiring within 7 days
 */
export async function GET() {
  try {
    const result = await refreshAllExpiringTokens()

    console.log(`[Cron] Token refresh: ${result.refreshed} refreshed, ${result.errors} errors`)

    return NextResponse.json({
      success: true,
      refreshed: result.refreshed,
      errors: result.errors,
      details: result.details,
    })
  } catch (err: any) {
    console.error('[Cron] Token refresh error:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST() {
  return GET()
}