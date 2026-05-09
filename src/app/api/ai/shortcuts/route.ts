import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { executeShortcut, type ShortcutAction, type ShortcutRequest } from '@/lib/ai/shortcuts'

// POST /api/ai/shortcuts — Execute an AI shortcut transformation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ShortcutRequest = await request.json()

    if (!body.action || !body.text) {
      return NextResponse.json({ error: 'Missing action or text' }, { status: 400 })
    }

    const validActions: ShortcutAction[] = [
      'emojify', 'hashtags', 'cta', 'tone_change', 'translate',
      'shorten', 'lengthen', 'repurpose', 'hook', 'rewrite'
    ]

    if (!validActions.includes(body.action)) {
      return NextResponse.json({ error: `Invalid action. Valid: ${validActions.join(', ')}` }, { status: 400 })
    }

    // Get user's brand voice for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('brand_voice, language')
      .eq('user_id', user.id)
      .single()

    if (profile?.brand_voice) {
      body.brandVoice = profile.brand_voice as Record<string, unknown>
    }
    if (!body.targetLanguage && profile?.language) {
      body.targetLanguage = profile.language as 'es' | 'de' | 'en'
    }

    const result = await executeShortcut(body)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[AI Shortcuts] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}