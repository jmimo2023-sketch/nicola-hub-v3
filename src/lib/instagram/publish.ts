'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInstagramConnection } from './auth'

const META_API_VERSION = 'v21.0'
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`

/** Get Page access token for the user */
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
  if (containerData.error) throw new Error(containerData.error.message)

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
      throw new Error('Error processing media')
    }
    attempts++
  }

  if (!ready) throw new Error('Timeout waiting for media processing')

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
  if (publishData.error) throw new Error(publishData.error.message)

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
    throw new Error('Carousel needs 2-10 images')
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
    if (data.error) throw new Error(data.error.message)
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
  if (carouselData.error) throw new Error(carouselData.error.message)

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
  if (publishData.error) throw new Error(publishData.error.message)

  return { published: true, mediaId: publishData.id }
}

/** Get Instagram Insights (basic metrics) */
export async function getInstagramInsights(
  userId: string,
  metrics: string[] = ['impressions', 'reach', 'follower_count', 'email_contacts', 'phone_call_clicks']
) {
  const { pageToken, igUserId } = await getPageToken(userId)

  const res = await fetch(
    `${META_BASE}/${igUserId}/insights?metric=${metrics.join(',')}&period=day&access_token=${pageToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.data
}

/** Get media insights for a specific post */
export async function getMediaInsights(
  userId: string,
  mediaId: string,
  metrics: string[] = ['impressions', 'reach', 'likes', 'comments', 'shares', 'saves']
) {
  const { pageToken } = await getPageToken(userId)

  const res = await fetch(
    `${META_BASE}/${mediaId}/insights?metric=${metrics.join(',')}&access_token=${pageToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.data
}

/** Get user's recent media */
export async function getRecentMedia(userId: string, limit = 25) {
  const { pageToken, igUserId } = await getPageToken(userId)

  const res = await fetch(
    `${META_BASE}/${igUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${pageToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.data
}

/** Best Time to Post — analyze when followers are most active */
export async function getBestTimeToPost(userId: string) {
  const { pageToken, igUserId } = await getPageToken(userId)

  // Get follower online presence data
  const res = await fetch(
    `${META_BASE}/${igUserId}/insights?metric=follower_count,online_followers&access_token=${pageToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)

  // Process online_followers data to find best times
  // Returns array of { day, hour, score }
  const onlineData = data.data?.find((d: any) => d.name === 'online_followers')
  if (!onlineData?.values?.[0]?.value) {
    // Fallback: return general best times
    return getDefaultBestTimes()
  }

  const hourlyData = onlineData.values[0].value as Record<string, number>
  return processBestTimes(hourlyData)
}

function getDefaultBestTimes() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const bestHours = [9, 12, 18, 21] // general IG best times

  return days.flatMap((day) =>
    bestHours.map((hour, i) => ({
      day,
      hour,
      score: 100 - i * 20,
    }))
  )
}

function processBestTimes(hourlyData: Record<string, number>) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const result: Array<{ day: string; hour: number; score: number }> = []

  for (const [key, count] of Object.entries(hourlyData)) {
    const dayIndex = Math.floor(Number(key) / 24)
    const hour = Number(key) % 24
    if (dayIndex < 7) {
      result.push({
        day: days[dayIndex],
        hour,
        score: count,
      })
    }
  }

  // Sort by score desc and return top 20
  return result.sort((a, b) => b.score - a.score).slice(0, 20)
}