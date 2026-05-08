import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateContentIdeas, generateTrendCaption } from '@/lib/ai/content-engine'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, ...params } = await request.json()

    if (action === 'ideas') {
      const ideas = await generateContentIdeas(params)
      return NextResponse.json({ ideas })
    }

    if (action === 'trend_caption') {
      const caption = await generateTrendCaption(params)
      return NextResponse.json({ caption })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}