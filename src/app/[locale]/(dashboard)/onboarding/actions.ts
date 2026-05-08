'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function saveOnboarding(data: {
  userId: string
  language: string
  pillars: string[]
  tone: string
}) {
  const supabase = await createServerSupabaseClient()
  
  // Verify the user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== data.userId) {
    return { error: 'Unauthorized' }
  }

  const brandVoiceData = {
    pillars: data.pillars.length > 0 ? data.pillars : ['emotional_mastery'],
    tone: data.tone,
    emoji_style: 'moderate',
    hashtag_strategy: 'mixed',
    include_cta: true,
    include_hook: true,
    max_hashtags: 15,
  }

  // Try update first
  const { error: updateError } = await supabase.from('profiles').update({
    language: data.language,
    onboarding_completed: true,
    brand_voice: brandVoiceData,
  }).eq('user_id', data.userId)

  if (updateError) {
    // If update fails (profile might not exist), try upsert
    const { error: upsertError } = await supabase.from('profiles').upsert({
      user_id: data.userId,
      display_name: user.email?.split('@')[0] || 'User',
      language: data.language,
      onboarding_completed: true,
      brand_voice: brandVoiceData,
    }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('[Onboarding] Upsert failed:', upsertError.message)
      return { error: upsertError.message }
    }
  }

  return { success: true }
}