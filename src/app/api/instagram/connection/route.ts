import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/** Get current user's Instagram connection status (lightweight, no API calls) */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: conn } = await supabase
      .from('meta_connections')
      .select('ig_user_id, ig_username, ig_followers_count, ig_media_count, access_token, expires_at, token_type')
      .eq('user_id', user.id)
      .single()

    if (!conn) return NextResponse.json({ connected: false })

    const isExpired = new Date(conn.expires_at) < new Date()
    if (isExpired) return NextResponse.json({ connected: true, expired: true, username: conn.ig_username })

    return NextResponse.json({
      connected: true,
      expired: false,
      igUserId: conn.ig_user_id,
      username: conn.ig_username,
      followersCount: conn.ig_followers_count,
      mediaCount: conn.ig_media_count,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}