import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateSmartReply } from '@/lib/instagram/engagement'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, language, brandVoice, pillar } = await request.json()
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

    // Get user profile for language/voice
    const { data: profile } = await supabase
      .from('profiles')
      .select('language, brand_voice')
      .eq('user_id', user.id)
      .single()

    const replies = await generateSmartReply(message, {
      language: language || profile?.language || 'es',
      brandVoice: brandVoice || (profile?.brand_voice as any)?.tone,
      pillar,
    })

    return NextResponse.json({ replies })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}