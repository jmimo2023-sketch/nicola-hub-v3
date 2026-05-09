import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/scheduling/create — Schedule a content item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contentItemId, scheduledDate, scheduledTime, timezone = 'America/Bogota' } = body

    if (!contentItemId || !scheduledDate || !scheduledTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update content item to scheduled
    const { error: updateError } = await supabase
      .from('content_items')
      .update({
        status: 'scheduled',
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        timezone,
      })
      .eq('id', contentItemId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[Scheduling] Update error:', updateError.message)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Create queue entry
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()

    const { data: queueItem, error: queueError } = await supabase
      .from('publishing_queue')
      .insert({
        user_id: user.id,
        content_item_id: contentItemId,
        status: 'pending',
        scheduled_at: scheduledAt,
      })
      .select()
      .single()

    if (queueError) {
      console.error('[Scheduling] Queue error:', queueError.message)
      // Content is still scheduled, just queue creation failed
      return NextResponse.json({ 
        warning: 'Content scheduled but queue creation failed',
        error: queueError.message 
      }, { status: 207 })
    }

    return NextResponse.json({ success: true, queueItem })
  } catch (error: any) {
    console.error('[Scheduling] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}