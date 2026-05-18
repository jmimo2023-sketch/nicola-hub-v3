'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInstagramConnection } from './auth'

const META_BASE = 'https://graph.instagram.com'

/** Get access token and IG user ID for the user */
async function getPageToken(userId: string) {
  const conn = await getInstagramConnection(userId)
  if (!conn || conn.isExpired) throw new Error('Instagram no conectado o token expirado')
  return {
    pageToken: conn.access_token,
    igUserId: conn.ig_user_id,
  }
}

/** Publish a post to Instagram Feed (single image) */
export async function publishInstagramPost(
  userId: string,
  imageUrl: string,
  caption: string,
  scheduledAt?: Date
) {
  const { pageToken, igUserId } = await getPageToken(userId)

  if (scheduledAt) {
    // Save as scheduled in our DB — actual publishing handled by cron
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('content_items')
      .insert({
        user_id: userId,
        type: 'post',
        pillar: 'emotional_mastery',
        status: 'scheduled',
        caption,
        scheduled_date: scheduledAt.toISOString().split('T')[0],
        scheduled_time: scheduledAt.toTimeString().split(' ')[0].slice(0, 5),
        metadata: { image_url: imageUrl, ig_user_id: igUserId },
        generated_by: 'manual',
      })
      .select()
      .single()

    if (error) throw error
    return { scheduled: true, id: data.id }
  }

  // Publish immediately
  // Step 1: Create media container
  const containerRes = await fetch(
    `${META_BASE}/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: pageToken,
      }),
    }
  )
  const containerData = await containerRes.json()
  if (containerData.error) throw new Error(containerData.error.message || containerData.error.error_message || 'Error creando contenedor')

  const containerId = containerData.id

  // Step 2: Wait for container to be ready
  let ready = false
  let attempts = 0
  while (!ready && attempts < 30) {
    await new Promise((r) => setTimeout(r, 2000))
    const statusRes = await fetch(
      `${META_BASE}/${containerId}?fields=status_code&access_token=${pageToken}`
    )
    const statusData = await statusRes.json()
    if (statusData.status_code === 'FINISHED') {
      ready = true
    } else if (statusData.status_code === 'ERROR') {
      throw new Error('Error procesando el medio')
    }
    attempts++
  }

  if (!ready) throw new Error('Timeout esperando procesamiento del medio')

  // Step 3: Publish
  const publishRes = await fetch(
    `${META_BASE}/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: pageToken,
      }),
    }
  )
  const publishData = await publishRes.json()
  if (publishData.error) throw new Error(publishData.error.message || publishData.error.error_message || 'Error publicando')

  // Update content item in DB
  const supabase = await createServerSupabaseClient()
  await supabase
    .from('content_items')
    .update({
      status: 'published',
      published_url: `https://instagram.com/p/${publishData.id}`,
      published_at: new Date().toISOString(),
    })
    .eq('metadata->>ig_container_id', containerId)

  return { published: true, mediaId: publishData.id }
}

/** Publish a Carousel post */
export async function publishInstagramCarousel(
  userId: string,
  imageUrls: string[],
  caption: string
) {
  const { pageToken, igUserId } = await getPageToken(userId)

  if (imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error('Carrusel necesita entre 2 y 10 imágenes')
  }

  // Step 1: Create children containers
  const childrenIds: string[] = []
  for (const url of imageUrls) {
    const res = await fetch(`${META_BASE}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: url,
        is_carousel_item: true,
        access_token: pageToken,
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message || data.error.error_message || 'Error creando item de carrusel')
    childrenIds.push(data.id)
  }

  // Step 2: Create carousel container
  const carouselRes = await fetch(`${META_BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: childrenIds.join(','),
      caption,
      access_token: pageToken,
    }),
  })
  const carouselData = await carouselRes.json()
  if (carouselData.error) throw new Error(carouselData.error.message || carouselData.error.error_message || 'Error creando carrusel')

  // Step 3: Publish carousel
  const publishRes = await fetch(`${META_BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: carouselData.id,
      access_token: pageToken,
    }),
  })
  const publishData = await publishRes.json()
  if (publishData.error) throw new Error(publishData.error.message || publishData.error.error_message || 'Error publicando carrusel')

  return { published: true, mediaId: publishData.id }
}

/** Get Instagram Insights (account-level metrics) */
export async function getInstagramInsights(
  userId: string,
  metrics: string[] = ['accounts_engaged', 'reach', 'follower_count', 'comments', 'likes', 'shares', 'saves']
) {
  const { pageToken, igUserId } = await getPageToken(userId)

  const res = await fetch(
    `${META_BASE}/${igUserId}/insights?metric=${metrics.join(',')}&period=day&access_token=${pageToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Error obteniendo insights')
  return data.data
}

/** Get media insights for a specific post */
export async function getMediaInsights(
  userId: string,
  mediaId: string,
  metrics: string[] = ['reach', 'likes', 'comments', 'shares', 'saved']
) {
  const { pageToken } = await getPageToken(userId)

  const res = await fetch(
    `${META_BASE}/${mediaId}/insights?metric=${metrics.join(',')}&access_token=${pageToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Error obteniendo media insights')
  return data.data
}

/** Get user's recent media */
export async function getRecentMedia(userId: string, limit = 25) {
  const { pageToken, igUserId } = await getPageToken(userId)

  const res = await fetch(
    `${META_BASE}/${igUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${pageToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Error obteniendo medios recientes')
  return data.data
}

/** Best Time to Post — smart fallback since Instagram Login API doesn't have online_followers */
export async function getBestTimeToPost(userId: string) {
  try {
    const { pageToken, igUserId } = await getPageToken(userId)

    // Try to get reach data by day/hour for guidance
    const res = await fetch(
      `${META_BASE}/${igUserId}/insights?metric=reach&period=day&access_token=${pageToken}`
    )
    const data = await res.json()

    if (data.error) {
      return getDefaultBestTimes()
    }

    // If we have reach data, we can infer posting patterns
    // But Instagram Login API doesn't give hourly breakdown, so use smart defaults
    return getDefaultBestTimes()
  } catch {
    return getDefaultBestTimes()
  }
}

function getDefaultBestTimes() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  // Data-driven best posting times for Instagram (global averages for lifestyle/wellness niches)
  const peakHours: Record<string, number[]> = {
    Mon: [7, 12, 18],
    Tue: [8, 12, 19],
    Wed: [8, 13, 18],
    Thu: [7, 12, 20],
    Fri: [9, 13, 19],
    Sat: [10, 14, 19],
    Sun: [10, 15, 20],
  }

  return days.flatMap((day) =>
    (peakHours[day] || [9, 12, 18]).map((hour, i) => ({
      day,
      hour,
      score: 100 - i * 25,
    }))
  )
}