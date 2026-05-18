import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getComments, getAllComments } from '@/lib/instagram/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const mediaId = request.nextUrl.searchParams.get('mediaId')

    if (mediaId) {
      // Get comments for a specific media post
      const comments = await getComments(user.id, mediaId)
      return NextResponse.json({ comments })
    } else {
      // Get all recent comments across posts
      const comments = await getAllComments(user.id)
      return NextResponse.json({ comments })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    const status = (err as { statusCode?: number })?.statusCode || 500
    return NextResponse.json({ error: message }, { status })
  }
}