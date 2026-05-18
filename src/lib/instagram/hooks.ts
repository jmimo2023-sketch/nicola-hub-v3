/**
 * React Hooks for Instagram Data
 *
 * Client-side hooks that fetch from API routes and manage loading/error state.
 * Each hook returns { data, loading, error, refetch }.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────────────

interface HookState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface HookResult<T> extends HookState<T> {
  refetch: () => Promise<void>
}

// ── API Fetch Helper ─────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const body = await res.json()
      message = body.error || body.message || message
    } catch {
      // use default message
    }
    throw new Error(message)
  }

  return res.json()
}

// ── useInstagramConnection ────────────────────────────────────────────────────

interface ConnectionInfo {
  connected: boolean
  expired?: boolean
  username?: string
  igUserId?: string
  followersCount?: number
  mediaCount?: number
}

export function useInstagramConnection(): HookResult<ConnectionInfo> {
  const [state, setState] = useState<HookState<ConnectionInfo>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchConnection = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await apiFetch<ConnectionInfo>('/api/instagram/connection')
      setState({ data, loading: false, error: null })
    } catch (err: unknown) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Error verificando conexión',
      })
    }
  }, [])

  useEffect(() => {
    fetchConnection()
  }, [fetchConnection])

  return {
    ...state,
    refetch: fetchConnection,
  }
}

// ── useInstagramProfile ───────────────────────────────────────────────────────

interface ProfileData {
  id: string
  username: string
  accountType: string
  mediaCount: number
  followersCount: number
}

export function useInstagramProfile(options?: { refetchOnFocus?: boolean }): HookResult<ProfileData> {
  const [state, setState] = useState<HookState<ProfileData>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchProfile = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await apiFetch<ProfileData>('/api/instagram/profile')
      setState({ data, loading: false, error: null })
    } catch (err: unknown) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Error cargando perfil',
      })
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Auto-refetch on window focus
  useEffect(() => {
    if (!options?.refetchOnFocus) return

    const onFocus = () => {
      fetchProfile()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchProfile, options?.refetchOnFocus])

  return {
    ...state,
    refetch: fetchProfile,
  }
}

// ── useInstagramInsights ──────────────────────────────────────────────────────

interface InsightsData {
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

export function useInstagramInsights(days = 30): HookResult<InsightsData> {
  const [state, setState] = useState<HookState<InsightsData>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchInsights = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await apiFetch<InsightsData>(`/api/instagram/analytics?days=${days}`)
      setState({ data, loading: false, error: null })
    } catch (err: unknown) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Error cargando analytics',
      })
    }
  }, [days])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return {
    ...state,
    refetch: fetchInsights,
  }
}

// ── useInstagramMedia ─────────────────────────────────────────────────────────

interface MediaItem {
  id: string
  caption: string | null
  mediaType: string
  mediaUrl: string | null
  permalink: string | null
  timestamp: string | null
  likeCount: number
  commentsCount: number
}

export function useInstagramMedia(limit = 25): HookResult<MediaItem[]> {
  const [state, setState] = useState<HookState<MediaItem[]>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchMedia = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await apiFetch<{ media: MediaItem[] }>(`/api/instagram/media?limit=${limit}`)
      setState({ data: data.media || [], loading: false, error: null })
    } catch (err: unknown) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Error cargando medios',
      })
    }
  }, [limit])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  return {
    ...state,
    refetch: fetchMedia,
  }
}

// ── useInstagramComments ──────────────────────────────────────────────────────

interface CommentItem {
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

/** Get Instagram connection info from client-side (uses browser Supabase client).
 *  Does NOT auto-refresh tokens — use server-side getInstagramConnection() for that.
 */
export async function getInstagramConnectionClient(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('meta_connections')
    .select('ig_user_id, ig_username, ig_followers_count, ig_media_count, access_token, expires_at, token_type')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  const isExpired = new Date(data.expires_at) < new Date()
  if (isExpired) return { ...data, isExpired: true }

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const needsRefresh = new Date(data.expires_at) < sevenDaysFromNow

  return { ...data, isExpired: false, needsRefresh }
}

export function useInstagramComments(mediaId?: string): HookResult<CommentItem[]> {
  const [state, setState] = useState<HookState<CommentItem[]>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchComments = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const endpoint = mediaId
        ? `/api/instagram/comments?mediaId=${mediaId}`
        : '/api/instagram/comments'
      const data = await apiFetch<{ comments: CommentItem[] }>(endpoint)
      setState({ data: data.comments || [], loading: false, error: null })
    } catch (err: unknown) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Error cargando comentarios',
      })
    }
  }, [mediaId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  return {
    ...state,
    refetch: fetchComments,
  }
}