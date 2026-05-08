import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'

/**
 * Get the current user's profile, transforming snake_case from Supabase to camelCase.
 * Redirects to /login if not authenticated.
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function getCurrentProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) return null

  // Transform snake_case → camelCase
  return {
    id: data.id,
    userId: data.user_id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    language: data.language || 'es',
    brandVoice: data.brand_voice || {},
    onboardingCompleted: data.onboarding_completed || false,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function getMetaConnection(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('meta_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) return null

  return {
    id: data.id,
    userId: data.user_id,
    accessToken: data.access_token,
    expiresAt: data.expires_at,
    scope: data.scope,
    igUserId: data.ig_user_id,
    igUsername: data.ig_username,
    igFollowersCount: data.ig_followers_count || 0,
    igMediaCount: data.ig_media_count || 0,
    pages: data.pages || [],
    isExpired: data.expires_at ? new Date(data.expires_at) < new Date() : true,
  }
}

export async function getContentItems(userId: string, status?: string) {
  const supabase = await createServerSupabaseClient()
  let query = supabase
    .from('content_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data } = await query
  return data || []
}

export async function getCampaigns(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}