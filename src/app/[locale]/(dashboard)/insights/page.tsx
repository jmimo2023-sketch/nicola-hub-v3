import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SmartInsights } from '@/components/insights/smart-insights'
import { getInstagramConnection } from '@/lib/instagram/auth'

export default async function InsightsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let igConnected = false
  let igAnalytics = null

  if (user) {
    try {
      const igConnection = await getInstagramConnection(user.id)
      if (igConnection && !igConnection.isExpired) {
        igConnected = true
        const { getAccountAnalytics } = await import('@/lib/instagram/analytics')
        igAnalytics = await getAccountAnalytics(user.id)
      }
    } catch (e) {
      console.error('Failed to fetch Instagram analytics:', e)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <SmartInsights igConnected={igConnected} realAnalytics={igAnalytics} />
    </div>
  )
}