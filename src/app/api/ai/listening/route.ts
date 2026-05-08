import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getBrandMentions, detectCrisisAlerts } from '@/lib/ai/social-listening'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('brand_voice')
      .eq('user_id', user.id)
      .single()

    const bv = (profile?.brand_voice as any) || {}
    const keywords: string[] = bv.listening_keywords || ['yoga', 'mindfulness', 'meditación']

    const mentions = await getBrandMentions(user.id, keywords)
    const alerts = await detectCrisisAlerts(user.id, mentions)

    return NextResponse.json({ mentions, alerts, keywords })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}