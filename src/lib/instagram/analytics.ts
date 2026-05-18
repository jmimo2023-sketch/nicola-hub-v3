'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInstagramConnection } from './auth'

const META_BASE = 'https://graph.instagram.com'

interface AnalyticsData {
  accounts_engaged: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  replies: number
  reposts: number
  followers: number
  engagement_rate: number
}

interface TimeSeriesPoint {
  date: string
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
  reach: number
  engagement_rate: number
  saves: number
  shares: number
}

/** Get comprehensive account analytics */
export async function getAccountAnalytics(userId: string, days = 30): Promise<{
  current: AnalyticsData
  previous: AnalyticsData
  timeseries: TimeSeriesPoint[]
  topPosts: MediaInsight[]
}> {
  const conn = await getInstagramConnection(userId)
  if (!conn) throw new Error('Instagram no conectado')

  const token = conn.access_token
  const igId = conn.ig_user_id

  // Fetch account-level metrics using Instagram Login API metrics
  const metrics = 'accounts_engaged,reach,follower_count,comments,likes,shares,saves,replies,reposts'
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
  const previousSince = new Date(Date.now() - days * 2 * 86400000).toISOString().split('T')[0]

  const [currentRes, previousRes] = await Promise.all([
    fetch(`${META_BASE}/${igId}/insights?metric=${metrics}&period=day&since=${since}&access_token=${token}`)
      .then(r => r.json()),
    fetch(`${META_BASE}/${igId}/insights?metric=${metrics}&period=day&since=${previousSince}&until=${since}&access_token=${token}`)
      .then(r => r.json()),
  ])

  // Parse metrics
  const current = parseMetrics(currentRes.data, days)
  const previous = parseMetrics(previousRes.data, days)

  // Build time series
  const timeseries = buildTimeSeries(currentRes.data)

  // Get top posts
  const topPosts = await getTopPosts(token, igId, 10)

  // Calculate engagement rate
  const totalInteractions = (current.likes || 0) + (current.comments || 0) + (current.shares || 0) + (current.saves || 0) + (current.replies || 0) + (current.reposts || 0)
  current.engagement_rate = current.reach > 0 ? (totalInteractions / current.reach) * 100 : 0
  const prevInteractions = (previous.likes || 0) + (previous.comments || 0) + (previous.shares || 0) + (previous.saves || 0) + (previous.replies || 0) + (previous.reposts || 0)
  previous.engagement_rate = previous.reach > 0 ? (prevInteractions / previous.reach) * 100 : 0

  // Save snapshot
  const supabase = await createServerSupabaseClient()
  await saveSnapshot(supabase, userId, current)

  return { current, previous, timeseries, topPosts }
}

function parseMetrics(data: any[], days: number): AnalyticsData {
  const result: AnalyticsData = {
    accounts_engaged: 0, reach: 0, likes: 0, comments: 0,
    shares: 0, saves: 0, replies: 0, reposts: 0, followers: 0,
    engagement_rate: 0,
  }

  if (!data) return result

  for (const metric of data) {
    const total = metric.values?.reduce((sum: number, v: any) => sum + (typeof v.value === 'number' ? v.value : 0), 0) ?? 0
    switch (metric.name) {
      case 'accounts_engaged': result.accounts_engaged = total; break
      case 'reach': result.reach = total; break
      case 'follower_count': result.followers = (metric.values?.[metric.values.length - 1] as any)?.value || 0; break
      case 'comments': result.comments = total; break
      case 'likes': result.likes = total; break
      case 'shares': result.shares = total; break
      case 'saves': result.saves = total; break
      case 'replies': result.replies = total; break
      case 'reposts': result.reposts = total; break
    }
  }

  return result
}

function buildTimeSeries(data: any[]): TimeSeriesPoint[] {
  if (!data) return []

  const reachByDate: Record<string, number> = {}
  const followersByDate: Record<string, number> = {}

  for (const metric of data) {
    for (const point of metric.values || []) {
      const date = point.end_time?.split('T')[0] || ''
      if (!date) continue
      if (metric.name === 'reach') reachByDate[date] = point.value || 0
      if (metric.name === 'follower_count') followersByDate[date] = point.value || 0
    }
  }

  const dates = [...new Set([...Object.keys(reachByDate), ...Object.keys(followersByDate)])].sort()
  return dates.map((date) => ({
    date,
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
      `${META_BASE}/${media.id}/insights?metric=reach,saved,shares&access_token=${token}`
    )
    const insightData = await insightRes.json()

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
    impressions: data.accounts_engaged, // Map accounts_engaged to impressions column
    reach: data.reach,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    saves: data.saves,
    followers: data.followers,
    engagement_rate: data.engagement_rate,
  }, { onConflict: 'user_id,date' })
}

/** Get competitor data — NOT AVAILABLE with Instagram Login API */
export async function getCompetitorData(_userId: string, _competitorUsername: string): Promise<{
  available: boolean
  message: string
}> {
  // Instagram Login API does not support Business Discovery (reading other accounts' data)
  // This feature requires Facebook Login with instagram_basic + pages_show_list permissions
  return {
    available: false,
    message: 'El análisis de competencia no está disponible con Instagram Login. Esta funcionalidad requiere Facebook Login con permisos adicionales.',
  }
}

/** Save competitor placeholder (no-op with Instagram Login) */
export async function addCompetitor(_userId: string, _username: string, _data: any) {
  // No-op: competitor tracking not available with Instagram Login
  console.warn('addCompetitor: feature not available with Instagram Login API')
}

/** Remove competitor placeholder (no-op with Instagram Login) */
export async function removeCompetitor(_userId: string, _username: string) {
  // No-op: competitor tracking not available with Instagram Login
  console.warn('removeCompetitor: feature not available with Instagram Login API')
}