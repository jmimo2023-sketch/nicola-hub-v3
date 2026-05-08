import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart3, Users, Eye, Heart, MessageCircle, Share2, Bookmark, TrendingUp } from 'lucide-react'
import { InstagramIcon } from '@/components/ui/instagram-icon'
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { InstagramConnect } from '@/components/instagram/instagram-connect'
import { BestTimeToPost } from '@/components/instagram/best-time-to-post'

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: igConnection } = await supabase
    .from('meta_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: snapshots } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  const { data: contentItems } = await supabase
    .from('content_items')
    .select('type, status, pillar')
    .eq('user_id', user.id)

  const language = profile?.language || locale || 'es'
  const isConnected = !!igConnection && !(
    igConnection.expires_at && new Date(igConnection.expires_at) < new Date()
  )

  const latestSnapshot = snapshots?.[0]
  const totalContent = contentItems?.length || 0
  const published = contentItems?.filter((c) => c.status === 'published').length || 0
  const scheduled = contentItems?.filter((c) => c.status === 'scheduled').length || 0
  const drafts = contentItems?.filter((c) => c.status === 'draft').length || 0

  // Pillar distribution
  const pillarCounts: Record<string, number> = {}
  contentItems?.forEach((c) => {
    pillarCounts[c.pillar] = (pillarCounts[c.pillar] || 0) + 1
  })

  const l = {
    title: language === 'de' ? 'Einblicke' : language === 'es' ? 'Insights' : 'Insights',
    subtitle: language === 'de' ? 'Leistung und Analysen' : language === 'es' ? 'Rendimiento y análisis' : 'Performance & analytics',
    connect: language === 'de' ? 'Instagram verbinden' : language === 'es' ? 'Conectar Instagram' : 'Connect Instagram',
    connectDesc: language === 'de' ? 'Verbinde dein Instagram für echte Analysen' : language === 'es' ? 'Conecta tu Instagram para analíticas reales' : 'Connect your Instagram for real analytics',
    followers: language === 'de' ? 'Follower' : language === 'es' ? 'Seguidores' : 'Followers',
    reach: language === 'de' ? 'Reichweite' : language === 'es' ? 'Alcance' : 'Reach',
    impressions: language === 'de' ? 'Impressionen' : language === 'es' ? 'Impresiones' : 'Impressions',
    engagement: language === 'de' ? 'Engagement' : language === 'es' ? 'Engagement' : 'Engagement',
    likes: language === 'de' ? 'Likes' : language === 'es' ? 'Likes' : 'Likes',
    comments: language === 'de' ? 'Kommentare' : language === 'es' ? 'Comentarios' : 'Comments',
    shares: language === 'de' ? 'Geteilt' : language === 'es' ? 'Compartidos' : 'Shares',
    saves: language === 'de' ? 'Gespeichert' : language === 'es' ? 'Guardados' : 'Saves',
    content: language === 'de' ? 'Inhalt' : language === 'es' ? 'Contenido' : 'Content',
    published: language === 'de' ? 'Veröffentlicht' : language === 'es' ? 'Publicados' : 'Published',
    scheduled: language === 'de' ? 'Geplant' : language === 'es' ? 'Programados' : 'Scheduled',
    drafts: language === 'de' ? 'Entwürfe' : language === 'es' ? 'Borradores' : 'Drafts',
    pillars: language === 'de' ? 'Säulen-Verteilung' : language === 'es' ? 'Distribución por pilares' : 'Pillar Distribution',
  }

  const kpis = [
    { label: l.followers, value: igConnection?.ig_followers_count || latestSnapshot?.followers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: l.reach, value: latestSnapshot?.reach || 0, icon: Eye, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: l.impressions, value: latestSnapshot?.impressions || 0, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: l.engagement, value: latestSnapshot?.engagement_rate ? `${latestSnapshot.engagement_rate}%` : '0%', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  ]

  const interactionKpis = [
    { label: l.likes, value: latestSnapshot?.likes || 0, icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: l.comments, value: latestSnapshot?.comments || 0, icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: l.shares, value: latestSnapshot?.shares || 0, icon: Share2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: l.saves, value: latestSnapshot?.saves || 0, icon: Bookmark, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ]

  const pillarEmojis: Record<string, string> = {
    emotional_mastery: '🧠',
    systematic_method: '📋',
    valley_experience: '🏔️',
    transformation: '🦋',
    community: '🤝',
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BarChart3 size={24} className="text-primary" />
          {l.title}
        </h1>
        <p className="text-muted-foreground mt-1">{l.subtitle}</p>
      </div>

      {/* Instagram Connection CTA */}
      {!isConnected && (
        <FadeIn>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <InstagramIcon size={20} className="text-primary" />
              <h2 className="font-bold">{l.connect}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{l.connectDesc}</p>
            <InstagramConnect userId={user.id} />
          </div>
        </FadeIn>
      )}

      {/* Main KPIs */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <StaggerItem key={i}>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className={`w-8 h-8 ${kpi.bg} rounded-xl flex items-center justify-center`}>
                <kpi.icon size={16} className={kpi.color} />
              </div>
              <div>
                <p className="text-2xl font-bold">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Interaction KPIs */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {interactionKpis.map((kpi, i) => (
          <StaggerItem key={i}>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <div className={`w-8 h-8 ${kpi.bg} rounded-xl flex items-center justify-center`}>
                <kpi.icon size={16} className={kpi.color} />
              </div>
              <div>
                <p className="text-lg font-bold">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Content Stats + Pillar Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold">{l.content}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-primary">{published}</p>
                <p className="text-xs text-muted-foreground">{l.published}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-blue-500">{scheduled}</p>
                <p className="text-xs text-muted-foreground">{l.scheduled}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-amber-500">{drafts}</p>
                <p className="text-xs text-muted-foreground">{l.drafts}</p>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn>
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-bold">{l.pillars}</h3>
            <div className="space-y-2">
              {Object.entries(pillarCounts).map(([pillar, count]) => (
                <div key={pillar} className="flex items-center gap-3">
                  <span className="text-lg">{pillarEmojis[pillar] || '📌'}</span>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${totalContent > 0 ? (count / totalContent) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{count}</span>
                </div>
              ))}
              {Object.keys(pillarCounts).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === 'de' ? 'Noch kein Inhalt' : language === 'es' ? 'Sin contenido aún' : 'No content yet'}
                </p>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Best Time to Post */}
      <FadeIn>
        <div className="bg-card border border-border rounded-2xl p-5">
          <BestTimeToPost language={language} isConnected={isConnected} />
        </div>
      </FadeIn>
    </PageTransition>
  )
}