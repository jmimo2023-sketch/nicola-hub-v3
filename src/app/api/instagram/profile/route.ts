import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/instagram/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const profile = await getProfile(user.id)
    return NextResponse.json(profile)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    const status = (err as { statusCode?: number })?.statusCode || 500
    return NextResponse.json({ error: message }, { status })
  }
}