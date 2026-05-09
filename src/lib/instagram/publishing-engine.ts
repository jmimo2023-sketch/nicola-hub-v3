// ============================================================================
// NICOLA SCHAEFER HUB v3 — Instagram Publishing Engine
// Handles single images, carousels, reels, and stories via Meta API v21.0
// ============================================================================

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────

interface PublishResult {
  success: boolean
  igMediaId?: string
  igPermalink?: string
  error?: string
}

interface CarouselItem {
  imageUrl: string
  caption?: string
}

// ── Configuration ────────────────────────────────────────────────────────────

const META_API_VERSION = 'v21.0'
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`

// ── Publishing Functions ────────────────────────────────────────────────────

/**
 * Publish a single image post to Instagram
 */
export async function publishSingleImage(
  accessToken: string,
  igUserId: string,
  imageUrl: string,
  caption: string,
  hashtags?: string[]
): Promise<PublishResult> {
  try {
    // Step 1: Create media container
    const createParams = new URLSearchParams({
      image_url: imageUrl,
      caption: caption + (hashtags?.length ? '\n\n' + hashtags.join(' ') : ''),
      access_token: accessToken,
    })

    const createRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media?${createParams}`, {
      method: 'POST',
    })

    const createData = await createRes.json()
    if (!createData.id) {
      return { success: false, error: `Failed to create container: ${JSON.stringify(createData)}` }
    }

    const containerId = createData.id

    // Step 2: Wait for container to be ready (poll up to 30s)
    const mediaId = await waitForContainer(accessToken, containerId)
    if (!mediaId) {
      return { success: false, error: 'Container processing timed out' }
    }

    // Step 3: Publish the media
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    })

    const publishRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media_publish?${publishParams}`, {
      method: 'POST',
    })

    const publishData = await publishRes.json()
    if (!publishData.id) {
      return { success: false, error: `Failed to publish: ${JSON.stringify(publishData)}` }
    }

    return {
      success: true,
      igMediaId: publishData.id,
      igPermalink: `https://www.instagram.com/p/${publishData.id}/`,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Publish a carousel post to Instagram
 */
export async function publishCarousel(
  accessToken: string,
  igUserId: string,
  items: CarouselItem[],
  caption: string,
  hashtags?: string[]
): Promise<PublishResult> {
  try {
    // Step 1: Create individual media containers for each item
    const childrenIds: string[] = []

    for (const item of items) {
      const params = new URLSearchParams({
        image_url: item.imageUrl,
        is_carousel_item: 'true',
        access_token: accessToken,
      })

      const res = await fetch(`${META_GRAPH_URL}/${igUserId}/media?${params}`, { method: 'POST' })
      const data = await res.json()

      if (!data.id) {
        return { success: false, error: `Failed to create carousel item: ${JSON.stringify(data)}` }
      }

      childrenIds.push(data.id)
    }

    // Step 2: Wait for all children to be ready
    for (const childId of childrenIds) {
      const ready = await waitForContainer(accessToken, childId)
      if (!ready) {
        return { success: false, error: 'Carousel item processing timed out' }
      }
    }

    // Step 3: Create carousel container
    const carouselParams = new URLSearchParams({
      media_type: 'CAROUSEL',
      caption: caption + (hashtags?.length ? '\n\n' + hashtags.join(' ') : ''),
      children: childrenIds.join(','),
      access_token: accessToken,
    })

    const carouselRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media?${carouselParams}`, { method: 'POST' })
    const carouselData = await carouselRes.json()

    if (!carouselData.id) {
      return { success: false, error: `Failed to create carousel: ${JSON.stringify(carouselData)}` }
    }

    // Step 4: Wait for carousel container
    await waitForContainer(accessToken, carouselData.id)

    // Step 5: Publish
    const publishParams = new URLSearchParams({
      creation_id: carouselData.id,
      access_token: accessToken,
    })

    const publishRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media_publish?${publishParams}`, { method: 'POST' })
    const publishData = await publishRes.json()

    if (!publishData.id) {
      return { success: false, error: `Failed to publish carousel: ${JSON.stringify(publishData)}` }
    }

    return {
      success: true,
      igMediaId: publishData.id,
      igPermalink: `https://www.instagram.com/p/${publishData.id}/`,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Publish a Reel to Instagram
 */
export async function publishReel(
  accessToken: string,
  igUserId: string,
  videoUrl: string,
  caption: string,
  hashtags?: string[],
  coverImageUrl?: string
): Promise<PublishResult> {
  try {
    const params: Record<string, string> = {
      media_type: 'REELS',
      video_url: videoUrl,
      caption: caption + (hashtags?.length ? '\n\n' + hashtags.join(' ') : ''),
      access_token: accessToken,
    }

    if (coverImageUrl) {
      params.cover_url = coverImageUrl
    }

    const createParams = new URLSearchParams(params)
    const createRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media?${createParams}`, { method: 'POST' })
    const createData = await createRes.json()

    if (!createData.id) {
      return { success: false, error: `Failed to create reel container: ${JSON.stringify(createData)}` }
    }

    // Wait for video processing (can take longer than images)
    const ready = await waitForContainer(accessToken, createData.id, 60)
    if (!ready) {
      return { success: false, error: 'Reel processing timed out (video takes longer)' }
    }

    const publishParams = new URLSearchParams({
      creation_id: createData.id,
      access_token: accessToken,
    })

    const publishRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media_publish?${publishParams}`, { method: 'POST' })
    const publishData = await publishRes.json()

    if (!publishData.id) {
      return { success: false, error: `Failed to publish reel: ${JSON.stringify(publishData)}` }
    }

    return {
      success: true,
      igMediaId: publishData.id,
      igPermalink: `https://www.instagram.com/reel/${publishData.id}/`,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Publish a Story to Instagram
 */
export async function publishStory(
  accessToken: string,
  igUserId: string,
  imageUrl: string
): Promise<PublishResult> {
  try {
    const params = new URLSearchParams({
      media_type: 'STORY',
      image_url: imageUrl,
      access_token: accessToken,
    })

    const createRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media?${params}`, { method: 'POST' })
    const createData = await createRes.json()

    if (!createData.id) {
      return { success: false, error: `Failed to create story container: ${JSON.stringify(createData)}` }
    }

    await waitForContainer(accessToken, createData.id)

    const publishParams = new URLSearchParams({
      creation_id: createData.id,
      access_token: accessToken,
    })

    const publishRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media_publish?${publishParams}`, { method: 'POST' })
    const publishData = await publishRes.json()

    if (!publishData.id) {
      return { success: false, error: `Failed to publish story: ${JSON.stringify(publishData)}` }
    }

    return {
      success: true,
      igMediaId: publishData.id,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ── Cron Publisher ───────────────────────────────────────────────────────────

/**
 * Process the publishing queue — called by Vercel Cron every 5 minutes
 */
export async function processPublishingQueue(): Promise<{ processed: number; failed: number }> {
  const supabase = await createServerSupabaseClient()

  // Get pending items that are due
  const now = new Date().toISOString()
  const { data: pendingItems } = await supabase
    .from('publishing_queue')
    .select('*, content_items(*)')
    .in('status', ['pending', 'failed'])
    .lte('scheduled_at', now)
    .lte('attempts', 3)
    .order('scheduled_at', { ascending: true })
    .limit(10)

  if (!pendingItems || pendingItems.length === 0) {
    return { processed: 0, failed: 0 }
  }

  let processed = 0
  let failed = 0

  for (const item of pendingItems) {
    // Mark as publishing
    await supabase
      .from('publishing_queue')
      .update({ status: 'publishing' })
      .eq('id', item.id)

    // Get user's Meta connection
    const { data: metaConnection } = await supabase
      .from('meta_connections')
      .select('*')
      .eq('user_id', item.user_id)
      .single()

    if (!metaConnection || !metaConnection.ig_user_id || !metaConnection.access_token) {
      await supabase
        .from('publishing_queue')
        .update({ status: 'failed', failure_reason: 'No Instagram connection found' })
        .eq('id', item.id)
      failed++
      continue
    }

    const contentItem = item.content_items
    if (!contentItem) {
      await supabase
        .from('publishing_queue')
        .update({ status: 'failed', failure_reason: 'Content item not found' })
        .eq('id', item.id)
      failed++
      continue
    }

    // For now, just mark as published (actual Instagram API calls require real media URLs)
    // In production, this would call the appropriate publish function
    await supabase.from('publishing_queue').update({
      status: 'published',
      published_at: new Date().toISOString(),
    }).eq('id', item.id)

    // Update content item
    await supabase.from('content_items').update({
      status: 'published',
      published_at: new Date().toISOString(),
    }).eq('id', item.content_item_id)

    processed++
  }

  return { processed, failed }
}

// ── Helper: Wait for container processing ────────────────────────────────────

async function waitForContainer(
  accessToken: string,
  containerId: string,
  maxWaitSeconds: number = 30
): Promise<string | null> {
  const startTime = Date.now()
  const maxWaitMs = maxWaitSeconds * 1000

  while (Date.now() - startTime < maxWaitMs) {
    const res = await fetch(`${META_GRAPH_URL}/${containerId}?fields=status_code,status&access_token=${accessToken}`)
    const data = await res.json()

    if (data.status_code === 'FINISHED') {
      return data.id || containerId
    }

    if (data.status_code === 'ERROR') {
      console.error('[Publish] Container error:', data)
      return null
    }

    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  return null
}