'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { instagramCache } from './cache'

const META_APP_ID = process.env.META_APP_ID!
const META_APP_SECRET = process.env.META_APP_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nicola-hub-v3.vercel.app'}/api/instagram/callback`

/** Step 1: Generate OAuth URL for Instagram Login (not Facebook) */
export async function getInstagramAuthUrl(userId: string) {
  const scopes = [
    'instagram_business_basic',
    'instagram_business_content_publish',
    'instagram_business_manage_comments',
    'instagram_business_manage_insights',
  ].join(',')

  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url')

  const url = new URL('https://www.instagram.com/oauth/authorize')
  url.searchParams.set('client_id', META_APP_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('scope', scopes)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)

  return url.toString()
}

/** Step 2: Exchange authorization code for short-lived token (1 hour) */
export async function exchangeCodeForToken(code: string) {
  const res = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
      code,
    }),
  })

  const data = await res.json()
  if (data.error) {
    throw new Error(data.error_message || data.error?.message || 'Error intercambiando código por token')
  }

  return {
    accessToken: data.access_token as string,
    userId: data.user_id as number,
  }
}

/** Step 3: Exchange short-lived token for long-lived token (60 days) */
export async function exchangeLongLivedToken(shortLivedToken: string) {
  const res = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${META_APP_SECRET}&access_token=${shortLivedToken}`
  )

  const data = await res.json()
  if (data.error) {
    throw new Error(data.error_message || 'Error obteniendo token de larga duración')
  }

  return {
    accessToken: data.access_token as string,
    tokenType: data.token_type as string,
    expiresIn: data.expires_in as number, // seconds until expiry (typically 5184000 = 60 days)
  }
}

/** Step 4: Refresh a long-lived token before it expires */
export async function refreshLongLivedToken(longLivedToken: string) {
  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${longLivedToken}`
  )

  const data = await res.json()
  if (data.error) {
    throw new Error(data.error_message || 'Error renovando token')
  }

  return {
    accessToken: data.access_token as string,
    tokenType: data.token_type as string,
    expiresIn: data.expires_in as number,
  }
}

/** Step 5: Get Instagram user profile */
export async function getInstagramUserProfile(accessToken: string) {
  const res = await fetch(
    `https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count&access_token=${accessToken}`
  )

  const data = await res.json()
  if (data.error) {
    throw new Error(data.error_message || 'Error obteniendo perfil de Instagram')
  }

  return {
    igUserId: String(data.id),
    username: data.username as string,
    accountType: data.account_type as string,
    mediaCount: data.media_count as number,
    followersCount: data.followers_count as number,
  }
}

/** Save Instagram connection to Supabase */
export async function saveInstagramConnection(
  userId: string,
  accessToken: string,
  expiresIn: number,
  profile: {
    igUserId: string
    username: string
    accountType: string
    mediaCount: number
    followersCount: number
  }
) {
  const supabase = await createServerSupabaseClient()

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

  const { error } = await supabase.from('meta_connections').upsert(
    {
      user_id: userId,
      access_token: accessToken,
      expires_at: expiresAt,
      scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_insights',
      ig_user_id: profile.igUserId,
      ig_username: profile.username,
      ig_followers_count: profile.followersCount,
      ig_media_count: profile.mediaCount,
      token_type: 'instagram_login',
      token_refreshed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) throw error

  return {
    igUsername: profile.username,
    igUserId: profile.igUserId,
    followers: profile.followersCount,
  }
}

/** Get user's Instagram connection status, auto-refresh token if nearing expiry.
 *  Uses cache to avoid redundant Supabase lookups. */
export async function getInstagramConnection(userId: string) {
  // Check cache first
  const cacheKey = instagramCache.key(userId, 'auth-connection')
  const cached = instagramCache.get<Record<string, unknown>>(cacheKey)
  if (cached) {
    // Still check expiry on cached data
    const isExpired = new Date(cached.expires_at as string) < new Date()
    if (isExpired) return { ...cached, isExpired: true }
    const expiresAt = new Date(cached.expires_at as string)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return { ...cached, isExpired: false, needsRefresh: expiresAt < sevenDaysFromNow }
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('meta_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) return null

  // Check if token is expired
  const isExpired = new Date(data.expires_at) < new Date()
  if (isExpired) {
    // Cache even expired state briefly so we don't hammer Supabase
    instagramCache.set(cacheKey, data, instagramCache.ttlFor('connection'))
    return { ...data, isExpired: true }
  }

  // Check if token needs refresh (within 7 days of expiry)
  const expiresAt = new Date(data.expires_at)
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const needsRefresh = expiresAt < sevenDaysFromNow

  if (needsRefresh && data.access_token) {
    try {
      const refreshed = await refreshLongLivedToken(data.access_token)
      const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()

      await supabase
        .from('meta_connections')
        .update({
          access_token: refreshed.accessToken,
          expires_at: newExpiresAt,
          token_refreshed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      // Invalidate all caches since token changed
      instagramCache.invalidateUser(userId)

      const updated = {
        ...data,
        access_token: refreshed.accessToken,
        expires_at: newExpiresAt,
        isExpired: false,
        needsRefresh: false,
      }

      // Cache the updated connection
      instagramCache.set(cacheKey, updated, instagramCache.ttlFor('connection'))

      return updated
    } catch (err) {
      console.error('Error auto-refreshing token:', err)
      // Cache and return connection anyway — will be flagged as expiring soon
      instagramCache.set(cacheKey, data, instagramCache.ttlFor('connection'))
      return { ...data, isExpired: false, needsRefresh: true }
    }
  }

  // Cache valid connections
  instagramCache.set(cacheKey, data, instagramCache.ttlFor('connection'))
  return { ...data, isExpired: false, needsRefresh: !!needsRefresh }
}



/** Disconnect Instagram */
export async function disconnectInstagram(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('meta_connections').delete().eq('user_id', userId)
  if (error) throw new Error('Error desconectando Instagram. Intenta de nuevo.')

  // Invalidate all caches for this user
  instagramCache.invalidateUser(userId)
}