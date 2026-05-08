'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

const META_APP_ID = process.env.META_APP_ID!
const META_APP_SECRET = process.env.META_APP_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nicola-hub-v3.vercel.app'}/api/instagram/callback`

/** Step 1: Generate OAuth URL for Instagram */
export async function getInstagramAuthUrl(userId: string) {
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'pages_read_engagement',
    'pages_manage_posts',
  ].join(',')

  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url')

  const url = new URL('https://www.facebook.com/v21.0/dialog/oauth')
  url.searchParams.set('client_id', META_APP_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('scope', scopes)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)

  return url.toString()
}

/** Step 2: Exchange code for short-lived token, then long-lived token */
export async function exchangeCodeForToken(code: string) {
  // Short-lived token
  const shortRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`
  )
  const shortData = await shortRes.json()
  if (shortData.error) throw new Error(shortData.error.message)

  // Long-lived token
  const longRes = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortData.access_token}`
  )
  const longData = await longRes.json()
  if (longData.error) throw new Error(longData.error.message)

  return {
    accessToken: longData.access_token as string,
    expiresIn: longData.expires_in as number, // seconds
    tokenType: longData.token_type as string,
  }
}

/** Step 3: Get user's Facebook Pages (needed for IG) */
export async function getUserPages(accessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,followers_count,media_count}&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.data as Array<{
    id: string
    name: string
    access_token: string
    instagram_business_account?: {
      id: string
      username: string
      followers_count: number
      media_count: number
    }
  }>
}

/** Step 4: Save connection to Supabase */
export async function saveInstagramConnection(
  userId: string,
  accessToken: string,
  expiresIn: number,
  pages: Array<{
    id: string
    name: string
    access_token: string
    instagram_business_account?: {
      id: string
      username: string
      followers_count: number
      media_count: number
    }
  }>
) {
  const supabase = await createServerSupabaseClient()

  // Find first page with IG business account
  const igPage = pages.find((p) => p.instagram_business_account)
  if (!igPage?.instagram_business_account) {
    throw new Error('No se encontró una cuenta de Instagram Business conectada a tus páginas de Facebook')
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

  const { error } = await supabase.from('meta_connections').upsert(
    {
      user_id: userId,
      access_token: igPage.access_token, // Page token (long-lived)
      expires_at: expiresAt,
      scope: 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,pages_read_engagement,pages_manage_posts',
      ig_user_id: igPage.instagram_business_account.id,
      ig_username: igPage.instagram_business_account.username,
      ig_followers_count: igPage.instagram_business_account.followers_count,
      ig_media_count: igPage.instagram_business_account.media_count,
      pages: pages.map((p) => ({ id: p.id, name: p.name })),
    },
    { onConflict: 'user_id' }
  )

  if (error) throw error

  return {
    igUsername: igPage.instagram_business_account.username,
    igUserId: igPage.instagram_business_account.id,
    followers: igPage.instagram_business_account.followers_count,
  }
}

/** Get user's Instagram connection status */
export async function getInstagramConnection(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('meta_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) return null

  // Check if token is expired
  const isExpired = new Date(data.expires_at) < new Date()
  if (isExpired) return { ...data, isExpired: true }

  return { ...data, isExpired: false }
}

/** Disconnect Instagram */
export async function disconnectInstagram(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.from('meta_connections').delete().eq('user_id', userId)
  if (error) throw error
}