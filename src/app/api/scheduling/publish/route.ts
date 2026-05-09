import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/scheduling/publish — Publish content immediately
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contentItemId } = await request.json()

    if (!contentItemId) {
      return NextResponse.json({ error: 'Missing contentItemId' }, { status: 400 })
    }

    // Get the content item
    const { data: contentItem, error: fetchError } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', contentItemId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !contentItem) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    // Get Meta connection
    const { data: metaConnection, error: metaError } = await supabase
      .from('meta_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (metaError || !metaConnection) {
      return NextResponse.json({ 
        error: 'Instagram account not connected. Please connect your account first.' 
      }, { status: 400 })
    }

    const igUserId = metaConnection.ig_user_id
    const accessToken = metaConnection.access_token

    if (!igUserId || !accessToken) {
      return NextResponse.json({ 
        error: 'Instagram business account not configured.' 
      }, { status: 400 })
    }

    // Update status to publishing
    await supabase
      .from('content_items')
      .update({ status: 'published' })
      .eq('id', contentItemId)

    // Mark queue items
    await supabase
      .from('publishing_queue')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('content_item_id', contentItemId)
      .eq('user_id', user.id)

    // For now, return success — actual Instagram publishing will be in Sprint 10
    // This is the placeholder that will call the Meta Content Publishing API
    return NextResponse.json({ 
      success: true, 
      message: 'Content marked as published. Instagram API integration coming in Sprint 10.',
      contentItem 
    })
  } catch (error: any) {
    console.error('[Publish] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}