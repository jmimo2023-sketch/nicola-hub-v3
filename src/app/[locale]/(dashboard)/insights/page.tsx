import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const language = locale || 'es'

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BarChart3 size={24} className="text-primary" />
          {language === 'de' ? 'Einblicke' : language === 'es' ? 'Analíticas' : 'Analytics'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {language === 'de' ? 'Leistung und Analysen' : language === 'es' ? 'Rendimiento y análisis' : 'Performance & analytics'}
        </p>
      </div>

      <AnalyticsDashboard />
    </PageTransition>
  )
}