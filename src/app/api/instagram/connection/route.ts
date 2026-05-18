import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getConnection } from '@/lib/instagram/client'

/** Get current user's Instagram connection status */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conn = await getConnection(user.id)

    if (!conn) return NextResponse.json({ connected: false })

    if (conn.isExpired) {
      return NextResponse.json({
        connected: true,
        expired: true,
        username: conn.igUsername,
      })
    }

    return NextResponse.json({
      connected: true,
      expired: false,
      igUserId: conn.igUserId,
      username: conn.igUsername,
      followersCount: conn.igFollowersCount,
      mediaCount: conn.igMediaCount,
    })
  } catch (err: unknown) {
    // If token expired or not connected, return appropriate status
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'NOT_CONNECTED') {
      return NextResponse.json({ connected: false })
    }
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'TOKEN_EXPIRED') {
      return NextResponse.json({ connected: true, expired: true })
    }
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}