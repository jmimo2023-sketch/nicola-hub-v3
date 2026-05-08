import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { replyToComment, sendInstagramDM, hideComment } from '@/lib/instagram/engagement'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, commentId, conversationId, recipientId, message } = await request.json()

    switch (action) {
      case 'reply_comment': {
        const result = await replyToComment(user.id, commentId, message)
        return NextResponse.json({ success: true, data: result })
      }
      case 'send_dm': {
        const result = await sendInstagramDM(user.id, recipientId, message)
        return NextResponse.json({ success: true, data: result })
      }
      case 'hide_comment': {
        const result = await hideComment(user.id, commentId)
        return NextResponse.json({ success: true, data: result })
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}