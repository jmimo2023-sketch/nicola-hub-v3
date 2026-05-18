import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ContentCalendar } from '@/components/calendar/content-calendar'
import { getInstagramConnection } from '@/lib/instagram/auth'

export default async function PlanPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let igConnected = false
  if (user) {
    try {
      const conn = await getInstagramConnection(user.id)
      if (conn && !conn.isExpired) igConnected = true
    } catch {}
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <ContentCalendar igConnected={igConnected} />
    </div>
  )
}