'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

const META_API_VERSION = 'v21.0'
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`

interface AnalyticsData {
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  followers: number
  engagement_rate: number
  profile_views: number
  website_clicks: number
}

interface TimeSeriesPoint {
  date: string
  impressions: number
  reach: number
  followers: number
  engagement_rate: number
}

interface MediaInsight {
  id: string
  caption: string
  media_type: string
  media_url: string
  permalink: string
  timestamp: string
  like_count: number
  comments_count: number
  impressions: number
  reach: number
  engagement_rate: number
  saves: number
  shares: number
}

interface CompetitorData {
  username: string
  followers: number
  media_count: number
  avg_likes: number
  avg_comments: number
  engagement_rate: number
  recent_posts: Array<{
    id: string
    caption: string
    like_count: number
    comments_count: number
    timestamp: string
  }>
}

/** Get comprehensive account analytics */
export async function getAccountAnalytics(userId: string, days = 30): Promise<{
  current: AnalyticsData
  previous: AnalyticsData
  timeseries: TimeSeriesPoint[]
  topPosts: MediaInsight[]
}> {
  const supabase = await createServerSupabaseClient()
  const { data: conn } = await supabase
    .from('meta_connections')
    .select('access_token, ig_user_id')
    .eq('user_id', userId)
    .single()

  if (!conn) throw new Error('Instagram no conectado')

  const token = conn.access_token
  const igId = conn.ig_user_id
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  // Fetch account-level metrics
  const metrics = [
    'impressions', 'reach', 'follower_count',
    'email_contacts', 'phone_call_clicks', 'text_message_clicks',
    'website_clicks', 'profile_views',
  ].join(',')

  const [currentRes, previousRes] = await Promise.all([
    fetch(`${META_BASE}/${igId}/insights?metric=${metrics}&period=day&since=${since}&access_token=${token}`),
    fetch(`${META_BASE}/${igId}/insights?metric=${metrics}&period=day&since=${new Date(Date.now() - days * 2 * 86400000).toISOString().split('T')[0]}&until=${since}&access_token=${token}`),
  ])

  const currentData = await currentRes.json()
  const previousData = await previousRes.json()

  // Parse current metrics
  const current = parseMetrics(currentData.data, days)
  const previous = parseMetrics(previousData.data, days)

  // Build time series
  const timeseries = buildTimeSeries(currentData.data)

  // Get top posts
  const topPosts = await getTopPosts(token, igId, 10)

  // Calculate engagement rate
  const totalInteractions = (current.likes || 0) + (current.comments || 0) + (current.shares || 0) + (current.saves || 0)
  current.engagement_rate = current.reach > 0 ? (totalInteractions / current.reach) * 100 : 0
  const prevInteractions = (previous.likes || 0) + (previous.comments || 0) + (previous.shares || 0) + (previous.saves || 0)
  previous.engagement_rate = previous.reach > 0 ? (prevInteractions / previous.reach) * 100 : 0

  // Save snapshot
  await saveSnapshot(supabase, userId, current)

  return { current, previous, timeseries, topPosts }
}

function parseMetrics(data: any[], days: number): AnalyticsData {
  const result: AnalyticsData = {
    impressions: 0, reach: 0, likes: 0, comments: 0,
    shares: 0, saves: 0, followers: 0, engagement_rate: 0,
    profile_views: 0, website_clicks: 0,
  }

  if (!data) return result

  for (const metric of data) {
    const total = metric.values?.reduce((sum: number, v: any) => sum + (typeof v.value === 'number' ? v.value : 0), 0) ?? 0
    switch (metric.name) {
      case 'impressions': result.impressions = total; break
      case 'reach': result.reach = total; break
      case 'follower_count': result.followers = (metric.values?.[metric.values.length - 1] as any)?.value || 0; break
      case 'profile_views': result.profile_views = total; break
      case 'website_clicks': result.website_clicks = total; break
    }
  }

  return result
}

function buildTimeSeries(data: any[]): TimeSeriesPoint[] {
  if (!data) return []

  const impressionsByDate: Record<string, number> = {}
  const reachByDate: Record<string, number> = {}
  const followersByDate: Record<string, number> = {}

  for (const metric of data) {
    for (const point of metric.values || []) {
      const date = point.end_time?.split('T')[0] || ''
      if (!date) continue
      if (metric.name === 'impressions') impressionsByDate[date] = point.value || 0
      if (metric.name === 'reach') reachByDate[date] = point.value || 0
      if (metric.name === 'follower_count') followersByDate[date] = point.value || 0
    }
  }

  const dates = [...new Set([...Object.keys(impressionsByDate), ...Object.keys(reachByDate)])].sort()
  return dates.map((date) => ({
    date,
    impressions: impressionsByDate[date] || 0,
    reach: reachByDate[date] || 0,
    followers: followersByDate[date] || 0,
    engagement_rate: 0, // computed client-side
  }))
}

async function getTopPosts(token: string, igId: string, limit: number): Promise<MediaInsight[]> {
  const mediaRes = await fetch(
    `${META_BASE}/${igId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${token}`
  )
  const mediaData = await mediaRes.json()
  if (mediaData.error) return []

  const posts: MediaInsight[] = []
  for (const media of mediaData.data?.slice(0, limit) || []) {
    // Get insights for each post
    const insightRes = await fetch(
      `${META_BASE}/${media.id}/insights?metric=impressions,reach,saved,shares&access_token=${token}`
    )
    const insightData = await insightRes.json()

    const impressions = insightData.data?.find((m: any) => m.name === 'impressions')?.values?.[0]?.value || 0
    const reach = insightData.data?.find((m: any) => m.name === 'reach')?.values?.[0]?.value || 0
    const saves = insightData.data?.find((m: any) => m.name === 'saved')?.values?.[0]?.value || 0
    const shares = insightData.data?.find((m: any) => m.name === 'shares')?.values?.[0]?.value || 0
    const totalEng = (media.like_count || 0) + (media.comments_count || 0) + saves + shares
    const engRate = reach > 0 ? (totalEng / reach) * 100 : 0

    posts.push({
      id: media.id,
      caption: media.caption?.substring(0, 100) || '',
      media_type: media.media_type,
      media_url: media.media_url,
      permalink: media.permalink,
      timestamp: media.timestamp,
      like_count: media.like_count || 0,
      comments_count: media.comments_count || 0,
      impressions,
      reach,
      engagement_rate: Math.round(engRate * 10) / 10,
      saves,
      shares,
    })
  }

  return posts.sort((a, b) => b.engagement_rate - a.engagement_rate)
}

async function saveSnapshot(supabase: any, userId: string, data: AnalyticsData) {
  const today = new Date().toISOString().split('T')[0]
  await supabase.from('analytics_snapshots').upsert({
    user_id: userId,
    date: today,
    impressions: data.impressions,
    reach: data.reach,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    saves: data.saves,
    followers: data.followers,
    engagement_rate: data.engagement_rate,
  }, { onConflict: 'user_id,date' })
}

/** Get competitor data (public info only) */
export async function getCompetitorData(userId: string, competitorUsername: string): Promise<CompetitorData> {
  const supabase = await createServerSupabaseClient()
  const { data: conn } = await supabase
    .from('meta_connections')
    .select('access_token')
    .eq('user_id', userId)
    .single()

  if (!conn) throw new Error('Instagram no conectado')

  // Search for business account
  const searchRes = await fetch(
    `${META_BASE}/${competitorUsername}?fields=id,username,followers_count,media_count&access_token=${conn.access_token}`
  )
  const searchData = await searchRes.json()

  if (searchData.error) {
    // Try searching via user id
    const altRes = await fetch(
      `${META_BASE}/ig-user-search?user_id=${competitorUsername}&access_token=${conn.access_token}`
    )
    throw new Error('No se pudo encontrar la cuenta. Asegúrate de que sea una cuenta de Instagram Business pública.')
  }

  // Get recent media
  const mediaRes = await fetch(
    `${META_BASE}/${searchData.id}/media?fields=id,caption,like_count,comments_count,timestamp&limit=10&access_token=${conn.access_token}`
  )
  const mediaData = await mediaRes.json()

  const recentPosts = (mediaData.data || []).map((m: any) => ({
    id: m.id,
    caption: m.caption?.substring(0, 100) || '',
    like_count: m.like_count || 0,
    comments_count: m.comments_count || 0,
    timestamp: m.timestamp,
  }))

  const totalLikes = recentPosts.reduce((sum: number, p: any) => sum + p.like_count, 0)
  const totalComments = recentPosts.reduce((sum: number, p: any) => sum + p.comments_count, 0)
  const avgLikes = recentPosts.length > 0 ? totalLikes / recentPosts.length : 0
  const avgComments = recentPosts.length > 0 ? totalComments / recentPosts.length : 0
  const engRate = searchData.followers_count > 0
    ? ((avgLikes + avgComments) / searchData.followers_count) * 100
    : 0

  return {
    username: searchData.username || competitorUsername,
    followers: searchData.followers_count || 0,
    media_count: searchData.media_count || 0,
    avg_likes: Math.round(avgLikes),
    avg_comments: Math.round(avgComments),
    engagement_rate: Math.round(engRate * 10) / 10,
    recent_posts: recentPosts,
  }
}

/** Save competitor to user's watch list */
export async function addCompetitor(userId: string, username: string, data: CompetitorData) {
  const supabase = await createServerSupabaseClient()

  // Add to profile metadata
  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_voice')
    .eq('user_id', userId)
    .single()

  const bv = (profile?.brand_voice as any) || {}
  const competitors = bv.competitors || []
  if (!competitors.find((c: any) => c.username === username)) {
    competitors.push({
      username,
      followers: data.followers,
      avg_engagement: data.engagement_rate,
      added_at: new Date().toISOString(),
    })
  }

  await supabase
    .from('profiles')
    .update({ brand_voice: { ...bv, competitors } })
    .eq('user_id', userId)
}

/** Remove competitor from watch list */
export async function removeCompetitor(userId: string, username: string) {
  const supabase = await createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_voice')
    .eq('user_id', userId)
    .single()

  const bv = (profile?.brand_voice as any) || {}
  const competitors = (bv.competitors || []).filter((c: any) => c.username !== username)

  await supabase
    .from('profiles')
    .update({ brand_voice: { ...bv, competitors } })
    .eq('user_id', userId)
}