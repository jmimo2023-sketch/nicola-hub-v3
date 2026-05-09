import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/scheduling/queue — Get the publishing queue
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending,publishing,failed'
    const statuses = status.split(',')

    // Get queue items with content details
    const { data: queue, error } = await supabase
      .from('publishing_queue')
      .select(`
        *,
        content_items (
          id, title, type, pillar, caption, hashtags, status, metadata, scheduled_date, scheduled_time
        )
      `)
      .eq('user_id', user.id)
      .in('status', statuses)
      .order('scheduled_at', { ascending: true })
      .limit(50)

    if (error) {
      console.error('[Queue] Error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ queue: queue || [] })
  } catch (error: any) {
    console.error('[Queue] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}