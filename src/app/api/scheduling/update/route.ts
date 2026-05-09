import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// PATCH /api/scheduling/update — Update a scheduled item (date, time, or cancel)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contentItemId, scheduledDate, scheduledTime, timezone, action } = body

    if (!contentItemId) {
      return NextResponse.json({ error: 'Missing contentItemId' }, { status: 400 })
    }

    // Cancel action
    if (action === 'cancel') {
      // Update content item back to draft
      await supabase
        .from('content_items')
        .update({ status: 'draft', scheduled_date: null, scheduled_time: null })
        .eq('id', contentItemId)
        .eq('user_id', user.id)

      // Cancel queue items
      await supabase
        .from('publishing_queue')
        .update({ status: 'cancelled' })
        .eq('content_item_id', contentItemId)
        .eq('user_id', user.id)
        .in('status', ['pending', 'publishing'])

      return NextResponse.json({ success: true, action: 'cancelled' })
    }

    // Reschedule action
    if (!scheduledDate || !scheduledTime) {
      return NextResponse.json({ error: 'Missing scheduledDate or scheduledTime' }, { status: 400 })
    }

    // Update content item
    const { error: updateError } = await supabase
      .from('content_items')
      .update({
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        timezone: timezone || 'America/Bogota',
      })
      .eq('id', contentItemId)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update queue item
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()

    await supabase
      .from('publishing_queue')
      .update({ scheduled_at: scheduledAt })
      .eq('content_item_id', contentItemId)
      .eq('user_id', user.id)
      .eq('status', 'pending')

    return NextResponse.json({ success: true, action: 'rescheduled' })
  } catch (error: any) {
    console.error('[Scheduling] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}