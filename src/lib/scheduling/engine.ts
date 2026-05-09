// ============================================================================
// NICOLA SCHAEFER HUB v3 — Scheduling Engine
// Calculates optimal posting times, manages the publishing queue
// ============================================================================

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────

export interface TimeSlot {
  hour: number
  minute: number
  score: number // 0-100, higher = better
  label: string
}

export interface ScheduleSuggestion {
  date: string
  time: string
  timezone: string
  reason: string
  score: number
}

export interface QueueItem {
  id: string
  contentItemId: string
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'cancelled'
  scheduledAt: string
  publishedAt: string | null
  failureReason: string | null
  attempts: number
  igContainerId: string | null
  igPermalink: string | null
}

// ── Best Time Calculator ───────────────────────────────────────────────────

const DEFAULT_PEAK_HOURS: Record<string, number[]> = {
  weekday: [7, 8, 9, 12, 13, 17, 18, 19, 20, 21],
  weekend: [9, 10, 11, 12, 13, 14, 15, 16, 19, 20],
}

const TIMEZONE_OFFSETS: Record<string, number> = {
  'America/Bogota': -5,
  'America/Cancun': -5,
  'Europe/Berlin': 1,
  'Europe/Madrid': 1,
  'US/Eastern': -5,
  'US/Pacific': -8,
}

export function calculateBestTimes(
  dayOfWeek: number, // 0=Sunday, 1=Monday...
  timezone: string = 'America/Bogota',
  engagementData?: Record<number, number> // hour -> avg engagement
): TimeSlot[] {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const peakHours = isWeekend ? DEFAULT_PEAK_HOURS.weekend : DEFAULT_PEAK_HOURS.weekday

  const slots: TimeSlot[] = peakHours.map(hour => {
    let score = 60 // base score

    // Boost if we have real engagement data
    if (engagementData && engagementData[hour]) {
      score = Math.min(100, 40 + engagementData[hour])
    }

    // Prime time boost (lunch and evening)
    if (hour === 12 || hour === 13) score += 15
    if (hour >= 18 && hour <= 21) score += 20

    // Morning boost
    if (hour >= 7 && hour <= 9) score += 10

    return {
      hour,
      minute: [0, 15, 30, 45][Math.floor(Math.random() * 4)], // add slight variation
      score: Math.min(100, score),
      label: formatTimeLabel(hour, timezone),
    }
  })

  return slots.sort((a, b) => b.score - a.score)
}

function formatTimeLabel(hour: number, timezone: string): string {
  const offset = TIMEZONE_OFFSETS[timezone] ?? -5
  const adjustedHour = (hour + offset + 24) % 24
  const period = adjustedHour >= 12 ? 'PM' : 'AM'
  const displayHour = adjustedHour === 0 ? 12 : adjustedHour > 12 ? adjustedHour - 12 : adjustedHour
  return `${displayHour}:00 ${period} ${timezone.replace('America/', '').replace('Europe/', '')}`
}

// ── Weekly Schedule Planner ────────────────────────────────────────────────

export interface WeekPlan {
  day: string
  date: string
  suggestedTime: string
  suggestedType: 'post' | 'reel' | 'story' | 'carousel'
  pillarSuggestion: string
}

export function generateWeeklyPlan(
  startDate: Date,
  pillars: string[],
  language: string = 'es'
): WeekPlan[] {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const daysDe = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

  const dayNames = language === 'de' ? daysDe : language === 'en' ? daysEn : days

  const contentMix = [
    { type: 'post' as const, weight: 3 },
    { type: 'reel' as const, weight: 2 },
    { type: 'story' as const, weight: 2 },
    { type: 'carousel' as const, weight: 1 },
  ]

  const totalWeight = contentMix.reduce((s, c) => s + c.weight, 0)

  const plan: WeekPlan[] = []
  const pillarCycle = [...pillars]

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    // Skip Sunday (rest day) or include light content
    if (date.getDay() === 0) continue

    // Determine content type based on weighted random
    const rand = Math.random() * totalWeight
    let cumulative = 0
    let selectedType: 'post' | 'reel' | 'story' | 'carousel' = 'post'
    for (const c of contentMix) {
      cumulative += c.weight
      if (rand <= cumulative) {
        selectedType = c.type
        break
      }
    }

    // Rotate through pillars
    const pillar = pillarCycle.shift() || pillars[0]
    pillarCycle.push(pillar)

    const bestSlots = calculateBestTimes(date.getDay())
    const topSlot = bestSlots[0]

    plan.push({
      day: dayNames[date.getDay()],
      date: date.toISOString().split('T')[0],
      suggestedTime: `${topSlot.hour.toString().padStart(2, '0')}:${topSlot.minute.toString().padStart(2, '0')}`,
      suggestedType: selectedType,
      pillarSuggestion: pillar,
    })
  }

  return plan
}

// ── Queue Management ───────────────────────────────────────────────────────

export async function getPublishingQueue(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('publishing_queue')
    .select(`
      *,
      content_items (
        id, title, type, pillar, caption, hashtags, status, metadata
      )
    `)
    .eq('user_id', userId)
    .in('status', ['pending', 'publishing', 'failed'])
    .order('scheduled_at', { ascending: true })

  if (error) {
    console.error('[Queue] Error fetching:', error.message)
    return []
  }

  return data || []
}

export async function addToQueue(contentItemId: string, scheduledAt: string, userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('publishing_queue')
    .insert({
      content_item_id: contentItemId,
      user_id: userId,
      status: 'pending',
      scheduled_at: scheduledAt,
    })
    .select()
    .single()

  if (error) {
    console.error('[Queue] Error adding:', error.message)
    return null
  }

  return data
}

export async function updateQueueStatus(
  queueId: string,
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'cancelled',
  updates: Partial<{
    published_at: string
    failure_reason: string
    ig_container_id: string
    ig_permalink: string
    attempts: number
  }> = {}
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('publishing_queue')
    .update({
      status,
      ...updates,
      ...(status === 'publishing' ? { attempts: { increment: 1 } } as any : {}),
    })
    .eq('id', queueId)

  if (error) {
    console.error('[Queue] Error updating:', error.message)
    return false
  }

  return true
}

export async function cancelQueueItem(queueId: string) {
  return updateQueueStatus(queueId, 'cancelled')
}

// ── Content Item Helpers ───────────────────────────────────────────────────

export async function scheduleContent(
  contentItemId: string,
  scheduledDate: string,
  scheduledTime: string,
  timezone: string,
  userId: string
) {
  const supabase = await createServerSupabaseClient()

  // Update the content item
  const { error: itemError } = await supabase
    .from('content_items')
    .update({
      status: 'scheduled',
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      timezone,
    })
    .eq('id', contentItemId)
    .eq('user_id', userId)

  if (itemError) {
    console.error('[Schedule] Error updating content item:', itemError.message)
    return null
  }

  // Create scheduled_at timestamp
  const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()

  // Add to publishing queue
  const queueItem = await addToQueue(contentItemId, scheduledAt, userId)
  return queueItem
}

export async function unscheduleContent(contentItemId: string, userId: string) {
  const supabase = await createServerSupabaseClient()

  // Update content item back to draft
  const { error: itemError } = await supabase
    .from('content_items')
    .update({
      status: 'draft',
      scheduled_date: null,
      scheduled_time: null,
    })
    .eq('id', contentItemId)
    .eq('user_id', userId)

  if (itemError) {
    console.error('[Unschedule] Error:', itemError.message)
    return false
  }

  // Cancel any pending queue items
  const { data: queueItems } = await supabase
    .from('publishing_queue')
    .select('id')
    .eq('content_item_id', contentItemId)
    .eq('status', 'pending')

  if (queueItems) {
    for (const item of queueItems) {
      await cancelQueueItem(item.id)
    }
  }

  return true
}