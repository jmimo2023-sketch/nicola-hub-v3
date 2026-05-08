import { NextRequest, NextResponse } from 'next/server'
import { getBestTimeToPost } from '@/lib/instagram/publish'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const times = await getBestTimeToPost(user.id)
    return NextResponse.json({ times })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}