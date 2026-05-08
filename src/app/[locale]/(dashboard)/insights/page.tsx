import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PILLARS } from '@/types'
import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2, Bookmark, UserPlus } from 'lucide-react'

export default async function InsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  const lang = (profile?.language || locale || 'es') as 'es' | 'de' | 'en'

  const { data: analytics } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  const { data: contentStats } = await supabase
    .from('content_items')
    .select('status, pillar')
    .eq('user_id', user.id)

  const totalPublished = contentStats?.filter((c: any) => c.status === 'published').length ?? 0
  const totalDraft = contentStats?.filter((c: any) => c.status === 'draft').length ?? 0

  // Pillar distribution
  const pillarCounts: Record<string, number> = {}
  contentStats?.forEach((c: any) => {
    pillarCounts[c.pillar] = (pillarCounts[c.pillar] || 0) + 1
  })

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { es: 'Insights', de: 'Insights', en: 'Insights' },
      subtitle: { es: 'Analíticas y rendimiento de tu contenido', de: 'Analysen und Leistung deiner Inhalte', en: 'Analytics and performance of your content' },
      overview: { es: 'Resumen General', de: 'Übersicht', en: 'Overview' },
      published: { es: 'Publicados', de: 'Veröffentlicht', en: 'Published' },
      drafts: { es: 'Borradores', de: 'Entwürfe', en: 'Drafts' },
      pillarDist: { es: 'Distribución por Pilares', de: 'Säulen-Verteilung', en: 'Pillar Distribution' },
      noData: { es: 'Conecta tu cuenta de Instagram para ver analíticas reales', de: 'Verbinde dein Instagram-Konto um echte Analysen zu sehen', en: 'Connect your Instagram account to see real analytics' },
      connectInstagram: { es: 'Conectar Instagram', de: 'Instagram verbinden', en: 'Connect Instagram' },
    }
    return translations[key]?.[lang] || key
  }

  const kpis = [
    { icon: Eye, label: { es: 'Impresiones', de: 'Impressionen', en: 'Impressions' }, value: analytics?.[0]?.impressions?.toLocaleString() || '—', color: 'text-blue-500' },
    { icon: Heart, label: { es: 'Likes', de: 'Likes', en: 'Likes' }, value: analytics?.[0]?.likes?.toLocaleString() || '—', color: 'text-rose-500' },
    { icon: MessageCircle, label: { es: 'Comentarios', de: 'Kommentare', en: 'Comments' }, value: analytics?.[0]?.comments?.toLocaleString() || '—', color: 'text-green-500' },
    { icon: Share2, label: { es: 'Compartidos', de: 'Geteilt', en: 'Shares' }, value: analytics?.[0]?.shares?.toLocaleString() || '—', color: 'text-purple-500' },
    { icon: Bookmark, label: { es: 'Guardados', de: 'Gespeichert', en: 'Saves' }, value: analytics?.[0]?.saves?.toLocaleString() || '—', color: 'text-amber-500' },
    { icon: UserPlus, label: { es: 'Nuevos Seguidores', de: 'Neue Follower', en: 'New Followers' }, value: analytics?.[0]?.followers?.toLocaleString() || '—', color: 'text-cyan-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BarChart3 size={24} className="text-primary" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors">
            <kpi.icon size={18} className={`${kpi.color} mb-2`} />
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label[lang]}</p>
          </div>
        ))}
      </div>

      {/* Content Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-lg font-bold mb-4">{t('overview')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('published')}</span>
              <span className="font-bold">{totalPublished}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('drafts')}</span>
              <span className="font-bold">{totalDraft}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-lg font-bold mb-4">{t('pillarDist')}</h3>
          {Object.keys(pillarCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(pillarCounts).map(([pillar, count]) => {
                const config = PILLARS[pillar as keyof typeof PILLARS]
                return (
                  <div key={pillar} className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      {config?.emoji} {config?.name || pillar}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(count / (contentStats?.length || 1)) * 100}%`, backgroundColor: config?.color || '#888' }} />
                      </div>
                      <span className="text-xs font-bold">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t('noData')}</p>
          )}
        </div>
      </div>

      {/* Instagram Connection CTA */}
      <div className="bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 border border-purple-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-1">Instagram</p>
            <p className="text-sm font-medium">{t('noData')}</p>
            <button className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-bold text-sm">
              📸 {t('connectInstagram')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}