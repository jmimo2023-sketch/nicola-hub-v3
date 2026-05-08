import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInstagramComments, getInstagramDMs } from '@/lib/instagram/engagement'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const type = request.nextUrl.searchParams.get('type') || 'all'

    let comments: any[] = []
    let dms: any[] = []

    try {
      if (type === 'all' || type === 'comments') {
        comments = await getInstagramComments(user.id)
      }
    } catch (err: any) {
      console.error('Comments fetch error:', err.message)
    }

    try {
      if (type === 'all' || type === 'dms') {
        dms = await getInstagramDMs(user.id)
      }
    } catch (err: any) {
      console.error('DMs fetch error:', err.message)
    }

    return NextResponse.json({ comments, dms, total: comments.length + dms.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}