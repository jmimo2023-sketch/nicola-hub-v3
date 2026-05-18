/**
 * Instagram API Client for Nicola Hub v3
 *
 * Provides a clean, typed interface to the Instagram Login API (graph.instagram.com)
 * with automatic token refresh, request deduplication, response caching,
 * rate limit awareness, and structured error handling.
 *
 * All methods require a userId and handle Supabase connection lookup internally.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { instagramCache } from './cache'
import type { CacheTTLs } from './cache'

// ── Base URL ─────────────────────────────────────────────────────────────────

const IG_API_BASE = 'https://graph.instagram.com'

// ── Typed Errors ────────────────────────────────────────────────────────────

export class InstagramApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'InstagramApiError'
  }
}

export class InstagramTokenExpiredError extends InstagramApiError {
  constructor() {
    super('Tu sesión de Instagram ha expirado. Por favor reconecta tu cuenta.', 'TOKEN_EXPIRED', 401)
    this.name = 'InstagramTokenExpiredError'
  }
}

export class InstagramRateLimitError extends InstagramApiError {
  constructor(retryAfter?: number) {
    super(
      'Has alcanzado el límite de llamadas a Instagram. Intenta de nuevo en unos minutos.',
      'RATE_LIMITED',
      429,
      { retryAfter }
    )
    this.name = 'InstagramRateLimitError'
  }
}

export class InstagramNotConnectedError extends InstagramApiError {
  constructor() {
    super('Instagram no está conectado. Conecta tu cuenta primero.', 'NOT_CONNECTED', 403)
    this.name = 'InstagramNotConnectedError'
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface InstagramProfile {
  id: string
  username: string
  accountType: string
  mediaCount: number
  followersCount: number
}

export interface InstagramMediaItem {
  id: string
  caption: string | null
  mediaType: string
  mediaUrl: string | null
  permalink: string | null
  timestamp: string | null
  likeCount: number
  commentsCount: number
}

export interface InstagramMediaInsight {
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
}

export interface InstagramAccountInsights {
  accountsEngaged: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  replies: number
  reposts: number
  followers: number
  engagementRate: number
  timeSeries: Array<{
    date: string
    reach: number
    followers: number
    engagementRate: number
  }>
}

export interface InstagramComment {
  id: string
  text: string
  from?: { id: string; username?: string }
  timestamp: string
  likeCount: number
  media?: {
    id: string
    caption: string | null
    mediaUrl: string | null
    permalink: string | null
  }
}

export interface ContainerCreationResult {
  containerId: string
}

export interface ContainerStatus {
  statusCode: 'FINISHED' | 'IN_PROGRESS' | 'ERROR'
  status?: string
}

export interface PublishResult {
  mediaId: string
}

export interface TokenRefreshResult {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface ConnectionData {
  id: string
  userId: string
  accessToken: string
  expiresAt: string
  igUserId: string
  igUsername: string
  igFollowersCount: number
  igMediaCount: number
  tokenType: string
  tokenRefreshedAt: string | null
  isExpired: boolean
  needsRefresh: boolean
}

// ── Request Deduplication ────────────────────────────────────────────────────

const pendingRequests = new Map<string, Promise<unknown>>()

/** Deduplicate concurrent identical requests */
function deduplicate<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key) as Promise<T> | undefined
  if (existing) return existing

  const promise = factory().finally(() => {
    pendingRequests.delete(key)
  })
  pendingRequests.set(key, promise)
  return promise
}

// ── Rate Limit Tracker ──────────────────────────────────────────────────────

const callTimestamps: number[] = []
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 180 // leave headroom from 200

/** Check and track rate limits. Throws if over limit. */
function trackRateLimit(): void {
  const now = Date.now()
  // Prune old timestamps
  while (callTimestamps.length > 0 && callTimestamps[0] < now - RATE_LIMIT_WINDOW) {
    callTimestamps.shift()
  }

  if (callTimestamps.length >= RATE_LIMIT_MAX) {
    throw new InstagramRateLimitError()
  }

  callTimestamps.push(now)
}

// ── Token Management ────────────────────────────────────────────────────────

async function getConnection(userId: string): Promise<ConnectionData> {
  const cacheKey = instagramCache.key(userId, 'connection')
  const cached = instagramCache.get<ConnectionData>(cacheKey)
  if (cached) return cached

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('meta_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new InstagramNotConnectedError()
  }

  const isExpired = new Date(data.expires_at) < new Date()
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const needsRefresh = !isExpired && new Date(data.expires_at) < sevenDaysFromNow

  const conn: ConnectionData = {
    id: data.id,
    userId: data.user_id,
    accessToken: data.access_token,
    expiresAt: data.expires_at,
    igUserId: data.ig_user_id,
    igUsername: data.ig_username,
    igFollowersCount: data.ig_followers_count,
    igMediaCount: data.ig_media_count,
    tokenType: data.token_type,
    tokenRefreshedAt: data.token_refreshed_at,
    isExpired,
    needsRefresh,
  }

  if (isExpired) {
    throw new InstagramTokenExpiredError()
  }

  // Proactive refresh if within 7 days
  if (needsRefresh) {
    try {
      const refreshed = await refreshTokenInternal(conn.accessToken)
      const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString()

      await supabase
        .from('meta_connections')
        .update({
          access_token: refreshed.accessToken,
          expires_at: newExpiresAt,
          token_refreshed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      // Invalidate all caches for this user since token changed
      instagramCache.invalidateUser(userId)

      conn.accessToken = refreshed.accessToken
      conn.expiresAt = newExpiresAt
      conn.needsRefresh = false
      conn.tokenRefreshedAt = new Date().toISOString()
    } catch (err) {
      console.error('[IG Client] Token refresh failed:', err)
      // Continue with current token — it's still valid, just expiring soon
    }
  }

  // Cache the connection
  instagramCache.set(cacheKey, conn, instagramCache.ttlFor('connection'))

  return conn
}

async function refreshTokenInternal(accessToken: string): Promise<TokenRefreshResult> {
  const res = await fetch(
    `${IG_API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
  )
  const data = await res.json()

  if (data.error) {
    throw new InstagramApiError(
      data.error_message || 'Error renovando el token de Instagram',
      'TOKEN_REFRESH_FAILED',
      res.status,
      data.error
    )
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
  }
}

// ── Core API Call ────────────────────────────────────────────────────────────

async function igFetch<T>(
  userId: string,
  endpoint: string,
  options: {
    method?: string
    body?: Record<string, unknown>
    params?: Record<string, string>
    cacheCategory?: keyof CacheTTLs
    cacheParams?: Record<string, string>
    noCache?: boolean
  } = {}
): Promise<T> {
  const { method = 'GET', body, params, cacheCategory, cacheParams, noCache } = options

  // 1. Check cache
  const cacheKey = cacheCategory
    ? instagramCache.key(userId, endpoint.split('?')[0] || endpoint, cacheParams)
    : undefined

  if (cacheKey && !noCache) {
    const cached = instagramCache.get<T>(cacheKey)
    if (cached) return cached
  }

  // 2. Get connection (with auto token refresh)
  const conn = await getConnection(userId)

  // 3. Track rate limit
  trackRateLimit()

  // 4. Build URL
  const url = new URL(`${IG_API_BASE}/${endpoint}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }
  url.searchParams.set('access_token', conn.accessToken)

  // 5. Deduplicate
  const dedupeKey = `${method}:${url.toString()}`
  const result = await deduplicate(dedupeKey, async () => {
    // 6. Fetch with retry
    return fetchWithRetry(url.toString(), { method, body })
  })

  // 7. Cache
  if (cacheKey && !noCache) {
    const ttl = cacheCategory ? instagramCache.ttlFor(cacheCategory) : 60000
    instagramCache.set(cacheKey, result as T, ttl)
  }

  return result as T
}

async function fetchWithRetry(
  url: string,
  options: { method: string; body?: Record<string, unknown> },
  retries = 2
): Promise<unknown> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: options.method,
        headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })

      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After')
        throw new InstagramRateLimitError(retryAfter ? parseInt(retryAfter) : undefined)
      }

      const data = await res.json()

      if (data.error) {
        const errMsg = data.error_message || data.error?.message || data.error.error_message || 'Error desconocido de Instagram'
        const errCode = data.error.code || data.error.type || 'API_ERROR'
        const errStatus = data.error.code === 190 ? 401 : res.status

        if (errCode === 'OAuthException' || data.error.code === 190) {
          throw new InstagramTokenExpiredError()
        }

        throw new InstagramApiError(errMsg, errCode, errStatus, data.error)
      }

      return data
    } catch (err) {
      if (err instanceof InstagramApiError) throw err

      lastError = err as Error

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }

  throw new InstagramApiError(
    `Error de conexión con Instagram. Intenta de nuevo. ${lastError?.message || ''}`.trim(),
    'NETWORK_ERROR'
  )
}

// ── Public API Methods ───────────────────────────────────────────────────────

/**
 * Get Instagram user profile
 */
export async function getProfile(userId: string): Promise<InstagramProfile> {
  const conn = await getConnection(userId)

  const data = await igFetch<Record<string, unknown>>(userId, 'me', {
    params: {
      fields: 'id,username,account_type,media_count,followers_count',
    },
    cacheCategory: 'profile',
  })

  return {
    id: String(data.id),
    username: data.username as string,
    accountType: data.account_type as string,
    mediaCount: data.media_count as number,
    followersCount: data.followers_count as number,
  }
}

/**
 * Get recent media posts
 */
export async function getMedia(userId: string, limit = 25): Promise<InstagramMediaItem[]> {
  const conn = await getConnection(userId)

  const data = await igFetch<Record<string, unknown>>(
    userId,
    `${conn.igUserId}/media`,
    {
      params: {
        fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
        limit: String(limit),
      },
      cacheCategory: 'media',
      cacheParams: { limit: String(limit) },
    }
  )

  const items = (data as Record<string, unknown>)?.data
  if (!Array.isArray(items)) return []

  return items.map((item: Record<string, unknown>) => ({
    id: String(item.id),
    caption: (item.caption as string) || null,
    mediaType: item.media_type as string,
    mediaUrl: (item.media_url as string) || null,
    permalink: (item.permalink as string) || null,
    timestamp: (item.timestamp as string) || null,
    likeCount: (item.like_count as number) || 0,
    commentsCount: (item.comments_count as number) || 0,
  }))
}

/**
 * Get insights for a specific media post
 */
export async function getMediaInsights(
  userId: string,
  mediaId: string
): Promise<InstagramMediaInsight> {
  const data = await igFetch<Record<string, unknown>>(
    userId,
    `${mediaId}/insights`,
    {
      params: {
        metric: 'reach,likes,comments,shares,saved',
      },
      cacheCategory: 'insights',
      cacheParams: { mediaId },
    }
  )

  const metrics = (data as Record<string, unknown>)?.data as Array<Record<string, unknown>> | undefined
  if (!metrics) {
    return { reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, engagementRate: 0 }
  }

  const getValue = (name: string): number => {
    const metric = metrics.find(m => m.name === name)
    if (!metric) return 0
    const values = metric.values as Array<Record<string, unknown>> | undefined
    if (!values || values.length === 0) return (metric.total_value as Record<string, unknown>)?.value as number || 0
    return (values[0]?.value as number) || 0
  }

  const reach = getValue('reach')
  const likes = getValue('likes')
  const comments = getValue('comments')
  const shares = getValue('shares')
  const saves = getValue('saved') // Instagram uses 'saved' not 'saves' in insights

  const totalEng = likes + comments + shares + saves
  const engagementRate = reach > 0 ? Math.round((totalEng / reach) * 100 * 10) / 10 : 0

  return { reach, likes, comments, shares, saves, engagementRate }
}

/**
 * Get account-level insights (analytics)
 */
export async function getAccountInsights(
  userId: string,
  days = 30
): Promise<InstagramAccountInsights> {
  const conn = await getConnection(userId)

  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
  const metrics = 'accounts_engaged,reach,follower_count,comments,likes,shares,saves,replies,reposts'

  const data = await igFetch<Record<string, unknown>>(
    userId,
    `${conn.igUserId}/insights`,
    {
      params: {
        metric: metrics,
        period: 'day',
        since,
      },
      cacheCategory: 'insights',
      cacheParams: { days: String(days) },
    }
  )

  const metricData = (data as Record<string, unknown>)?.data as Array<Record<string, unknown>> | undefined
  if (!metricData) {
    return {
      accountsEngaged: 0, reach: 0, likes: 0, comments: 0,
      shares: 0, saves: 0, replies: 0, reposts: 0, followers: 0,
      engagementRate: 0, timeSeries: [],
    }
  }

  // Aggregate metric values
  const getMetricTotal = (name: string): number => {
    const m = metricData.find(d => d.name === name)
    if (!m) return 0
    const values = m.values as Array<Record<string, unknown>> | undefined
    if (!values) return 0
    return values.reduce((sum, v) => sum + ((v.value as number) || 0), 0)
  }

  // For follower_count, take the latest value (not sum)
  const getMetricLatest = (name: string): number => {
    const m = metricData.find(d => d.name === name)
    if (!m) return 0
    const values = m.values as Array<Record<string, unknown>> | undefined
    if (!values || values.length === 0) return 0
    return (values[values.length - 1].value as number) || 0
  }

  // Build time series
  const reachByDate: Record<string, number> = {}
  const followersByDate: Record<string, number> = {}

  for (const metric of metricData) {
    const values = metric.values as Array<Record<string, unknown>> | undefined
    if (!values) continue
    for (const point of values) {
      const date = (point.end_time as string)?.split('T')[0] || ''
      if (!date) continue
      if (metric.name === 'reach') reachByDate[date] = (point.value as number) || 0
      if (metric.name === 'follower_count') followersByDate[date] = (point.value as number) || 0
    }
  }

  const dates = [...new Set([...Object.keys(reachByDate), ...Object.keys(followersByDate)])].sort()

  const reach = getMetricTotal('reach')
  const likes = getMetricTotal('likes')
  const comments = getMetricTotal('comments')
  const shares = getMetricTotal('shares')
  const saves = getMetricTotal('saves')
  const replies = getMetricTotal('replies')
  const reposts = getMetricTotal('reposts')
  const accountsEngaged = getMetricTotal('accounts_engaged')
  const followers = getMetricLatest('follower_count')
  const totalInteractions = likes + comments + shares + saves + replies + reposts
  const engagementRate = reach > 0 ? Math.round((totalInteractions / reach) * 100 * 10) / 10 : 0

  return {
    accountsEngaged,
    reach,
    likes,
    comments,
    shares,
    saves,
    replies,
    reposts,
    followers,
    engagementRate,
    timeSeries: dates.map(date => ({
      date,
      reach: reachByDate[date] || 0,
      followers: followersByDate[date] || 0,
      engagementRate: 0, // computed client-side with per-day interactions
    })),
  }
}

/**
 * Get comments on a specific media post
 */
export async function getComments(
  userId: string,
  mediaId: string
): Promise<InstagramComment[]> {
  const data = await igFetch<Record<string, unknown>>(
    userId,
    `${mediaId}/comments`,
    {
      params: {
        fields: 'id,text,from,timestamp,like_count',
      },
      cacheCategory: 'comments',
      cacheParams: { mediaId },
    }
  )

  const items = (data as Record<string, unknown>)?.data
  if (!Array.isArray(items)) return []

  return items.map((item: Record<string, unknown>) => ({
    id: String(item.id),
    text: item.text as string,
    from: item.from ? { id: String((item.from as Record<string, unknown>).id), username: (item.from as Record<string, unknown>).username as string | undefined } : undefined,
    timestamp: item.timestamp as string,
    likeCount: (item.like_count as number) || 0,
  }))
}

/**
 * Get all recent comments across the user's media
 */
export async function getAllComments(
  userId: string,
  limit = 10
): Promise<InstagramComment[]> {
  const conn = await getConnection(userId)
  const media = await getMedia(userId, limit)

  const allComments: InstagramComment[] = []

  for (const post of media.slice(0, 10)) {
    try {
      // Don't cache aggregated endpoint — individual comment calls are cached
      const comments = await getComments(userId, post.id)
      for (const comment of comments) {
        allComments.push({
          ...comment,
          media: {
            id: post.id,
            caption: post.caption?.substring(0, 80) || null,
            mediaUrl: post.mediaUrl,
            permalink: post.permalink,
          },
        })
      }
    } catch {
      // Skip posts with errors
    }
  }

  // Sort by timestamp desc
  allComments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return allComments
}

/**
 * Step 1 of publishing: Create a media container
 */
export async function createContainer(
  userId: string,
  imageUrl: string,
  caption: string
): Promise<ContainerCreationResult> {
  const conn = await getConnection(userId)

  const data = await igFetch<Record<string, unknown>>(
    userId,
    `${conn.igUserId}/media`,
    {
      method: 'POST',
      body: {
        image_url: imageUrl,
        caption,
        access_token: conn.accessToken,
      },
      noCache: true,
    }
  )

  if (!(data as Record<string, unknown>).id) {
    throw new InstagramApiError('Error creando el contenedor de medios', 'CONTAINER_CREATE_FAILED')
  }

  return { containerId: String((data as Record<string, unknown>).id) }
}

/**
 * Step 2 of publishing: Check container status
 */
export async function getContainerStatus(
  userId: string,
  containerId: string
): Promise<ContainerStatus> {
  const data = await igFetch<Record<string, unknown>>(
    userId,
    containerId,
    {
      params: {
        fields: 'status_code,status',
      },
      noCache: true,
    }
  )

  return {
    statusCode: (data as Record<string, unknown>).status_code as ContainerStatus['statusCode'],
    status: (data as Record<string, unknown>).status as string | undefined,
  }
}

/**
 * Step 3 of publishing: Publish the container
 */
export async function publishContainer(
  userId: string,
  containerId: string
): Promise<PublishResult> {
  const conn = await getConnection(userId)

  const data = await igFetch<Record<string, unknown>>(
    userId,
    `${conn.igUserId}/media_publish`,
    {
      method: 'POST',
      body: {
        creation_id: containerId,
        access_token: conn.accessToken,
      },
      noCache: true,
    }
  )

  if (!(data as Record<string, unknown>).id) {
    throw new InstagramApiError('Error publicando el contenido', 'PUBLISH_FAILED')
  }

  // Invalidate media cache after publishing
  instagramCache.invalidateUser(userId)

  return { mediaId: String((data as Record<string, unknown>).id) }
}

/**
 * Refresh a long-lived token manually
 */
export async function refreshToken(userId: string): Promise<TokenRefreshResult> {
  const conn = await getConnection(userId)

  const result = await refreshTokenInternal(conn.accessToken)

  // Update Supabase
  const supabase = await createServerSupabaseClient()
  const newExpiresAt = new Date(Date.now() + result.expiresIn * 1000).toISOString()

  await supabase
    .from('meta_connections')
    .update({
      access_token: result.accessToken,
      expires_at: newExpiresAt,
      token_refreshed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  // Invalidate all caches for this user
  instagramCache.invalidateUser(userId)

  return result
}

/**
 * Get connection data for a user (exposed for auth.ts and API routes)
 */
export { getConnection }

/**
 * Invalidate all caches for a user — use after writes/mutations
 */
export function invalidateCache(userId: string): void {
  instagramCache.invalidateUser(userId)
}