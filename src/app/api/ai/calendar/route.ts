import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateWeeklyCalendar } from '@/lib/ai/content-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { language, pillars, brandVoice, niche, weekStart } = await request.json()

    // Get user profile if not provided
    if (!language || !pillars?.length) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('language, brand_voice')
        .eq('user_id', user.id)
        .single()

      const bv = profile?.brand_voice as any
      const params = {
        language: language || profile?.language || 'es',
        pillars: pillars || bv?.pillars || ['emotional_mastery'],
        brandVoice: brandVoice || bv?.tone,
        niche: niche,
        weekStart: weekStart || new Date().toISOString().split('T')[0],
      }

      const calendar = await generateWeeklyCalendar(params)
      return NextResponse.json({ calendar })
    }

    const calendar = await generateWeeklyCalendar({
      language,
      pillars,
      brandVoice,
      niche,
      weekStart: weekStart || new Date().toISOString().split('T')[0],
    })

    return NextResponse.json({ calendar })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}