import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getListeningKeywords, saveListeningKeywords } from '@/lib/ai/social-listening'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const keywords = await getListeningKeywords(user.id)
    return NextResponse.json({ keywords })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { keywords } = await request.json()
    if (!Array.isArray(keywords)) return NextResponse.json({ error: 'keywords must be array' }, { status: 400 })

    const saved = await saveListeningKeywords(user.id, keywords)
    return NextResponse.json({ keywords: saved })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}