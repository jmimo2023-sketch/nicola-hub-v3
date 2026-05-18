import { NextRequest, NextResponse } from 'next/server'
import { checkAndRefreshToken } from '@/lib/instagram/token-refresh'

export async function POST(request: NextRequest) {
  try {
    // Get userId from request body or from auth session
    const body = await request.json().catch(() => ({}))
    const userId = body.userId

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    const result = await checkAndRefreshToken(userId)

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      refreshed: result.refreshed,
    })
  } catch (err: any) {
    console.error('Token refresh error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}