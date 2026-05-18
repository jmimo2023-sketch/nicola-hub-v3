import { createServerSupabaseClient } from '@/lib/supabase/server'
import { HomeDashboard } from '@/components/home/home-dashboard'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get content stats
  const { data: contentItems } = await supabase
    .from('content_items')
    .select('id, status, pillar, type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get recent analytics
  const { data: analytics } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(7)

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_voice, language, display_name')
    .eq('user_id', user.id)
    .single()

  // Get Instagram connection status (lightweight — no API calls)
  let igConnection = null
  try {
    const { data: conn } = await supabase
      .from('meta_connections')
      .select('ig_user_id, ig_username, ig_followers_count, ig_media_count, expires_at')
      .eq('user_id', user.id)
      .single()

    if (conn) {
      const isExpired = new Date(conn.expires_at) < new Date()
      igConnection = {
        ig_user_id: conn.ig_user_id,
        ig_username: conn.ig_username,
        ig_followers_count: conn.ig_followers_count,
        ig_media_count: conn.ig_media_count,
        isExpired,
      }
    }
  } catch (e) {
    // No connection — that's fine
  }

  const stats = {
    total: contentItems?.length || 0,
    drafts: contentItems?.filter(c => c.status === 'draft').length || 0,
    scheduled: contentItems?.filter(c => c.status === 'scheduled').length || 0,
    published: contentItems?.filter(c => c.status === 'published').length || 0,
    thisWeek: contentItems?.filter(c => {
      const d = new Date(c.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return d >= weekAgo
    }).length || 0,
  }

  return (
    <HomeDashboard
      stats={stats}
      contentItems={contentItems || []}
      analytics={analytics || []}
      profile={profile}
      igConnection={igConnection}
    />
  )
}