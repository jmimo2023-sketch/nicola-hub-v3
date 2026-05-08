import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAccountAnalytics } from '@/lib/instagram/analytics'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const days = parseInt(request.nextUrl.searchParams.get('days') || '30')
    const analytics = await getAccountAnalytics(user.id, days)
    return NextResponse.json(analytics)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}