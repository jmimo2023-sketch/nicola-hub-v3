import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { discoverTrends } from '@/lib/ai/social-listening'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { language, niche, pillars } = await request.json()

    const { data: profile } = await supabase
      .from('profiles')
      .select('language, brand_voice')
      .eq('user_id', user.id)
      .single()

    const bv = (profile?.brand_voice as any) || {}
    const trends = await discoverTrends({
      language: language || profile?.language || 'es',
      niche: niche || 'yoga, espiritualidad, coaching personal',
      pillars: pillars || bv.pillars || ['emotional_mastery'],
    })

    return NextResponse.json({ trends })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}