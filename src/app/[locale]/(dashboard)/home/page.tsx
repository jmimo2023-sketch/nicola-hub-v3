import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Eye, Heart, UserPlus, TrendingUp, PenTool, Calendar, BarChart3, Sparkles, Clock, Plus, FileText } from 'lucide-react'
import Link from 'next/link'
import { PILLARS } from '@/types'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const lang = (profile?.language || locale || 'es') as 'es' | 'de' | 'en'

  // Fetch real content items
  const { data: contentItems } = await supabase
    .from('content_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: scheduledCount } = await supabase
    .from('content_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'scheduled')

  const { data: draftCount } = await supabase
    .from('content_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'draft')

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      greeting: { es: 'Buenos días', de: 'Guten Tag', en: 'Good morning' },
      subtitle: { es: 'Aquí está tu resumen de la semana.', de: 'Hier ist deine Übersicht für diese Woche.', en: "Here's your overview for this week." },
      quickActions: { es: 'Acciones Rápidas', de: 'Schnellstart', en: 'Quick Actions' },
      createContent: { es: 'Crear Contenido', de: 'Inhalt erstellen', en: 'Create Content' },
      schedulePost: { es: 'Programar Post', de: 'Beitrag planen', en: 'Schedule Post' },
      viewInsights: { es: 'Ver Insights', de: 'Analysen ansehen', en: 'View Insights' },
      upcomingPosts: { es: 'Próximas Publicaciones', de: 'Kommende Beiträge', en: 'Upcoming Posts' },
      noScheduled: { es: 'No hay publicaciones programadas', de: 'Keine geplanten Beiträge', en: 'No scheduled posts' },
      createFirst: { es: 'Crea tu primera publicación', de: 'Erstelle deinen ersten Beitrag', en: 'Create your first post' },
      recentContent: { es: 'Contenido Reciente', de: 'Neueste Inhalte', en: 'Recent Content' },
      drafts: { es: 'Borradores', de: 'Entwürfe', en: 'Drafts' },
      scheduled: { es: 'Programados', de: 'Geplant', en: 'Scheduled' },
      totalViews: { es: 'Vistas Totales', de: 'Gesamtansichten', en: 'Total Views' },
      engagement: { es: 'Engagement', de: 'Engagement', en: 'Engagement' },
    }
    return translations[key]?.[lang] || key
  }

  const pillarLabel = (pillar: string) => {
    const p = PILLARS[pillar as keyof typeof PILLARS]
    return p ? `${p.emoji} ${p.name}` : pillar
  }

  const statusLabel = (status: string) => {
    const map: Record<string, Record<string, string>> = {
      draft: { es: 'Borrador', de: 'Entwurf', en: 'Draft' },
      review: { es: 'Revisión', de: 'Review', en: 'Review' },
      approved: { es: 'Aprobado', de: 'Genehmigt', en: 'Approved' },
      scheduled: { es: 'Programado', de: 'Geplant', en: 'Scheduled' },
      published: { es: 'Publicado', de: 'Veröffentlicht', en: 'Published' },
    }
    return map[status]?.[lang] || status
  }

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl lg:text-4xl font-bold">
          {t('greeting')}, {profile?.display_name || 'Nicola'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <FileText size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold">{draftCount?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('drafts')}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <Calendar size={18} className="text-green-500" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold">{scheduledCount?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('scheduled')}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <Eye size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold">—</p>
          <p className="text-xs text-muted-foreground mt-1">{t('totalViews')}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <Heart size={18} className="text-rose-500" />
          </div>
          <p className="text-2xl lg:text-3xl font-bold">—</p>
          <p className="text-xs text-muted-foreground mt-1">{t('engagement')}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display text-lg font-bold mb-4">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href={`/${locale}/create`} className="group bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/30 transition-all">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PenTool size={20} className="text-white" />
            </div>
            <p className="font-bold text-sm">{t('createContent')}</p>
          </Link>
          <Link href={`/${locale}/plan`} className="group bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/30 transition-all">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calendar size={20} className="text-white" />
            </div>
            <p className="font-bold text-sm">{t('schedulePost')}</p>
          </Link>
          <Link href={`/${locale}/insights`} className="group bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/30 transition-all">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 size={20} className="text-white" />
            </div>
            <p className="font-bold text-sm">{t('viewInsights')}</p>
          </Link>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">AI Insight</p>
            <p className="text-sm font-medium leading-relaxed">
              {lang === 'de'
                ? 'Deine beste Postzeit ist 20:00 Uhr. Beiträge über das Tal erleben 40% mehr Engagement. Versuche diese Woche einen Reel über Transformation zu erstellen.'
                : lang === 'es'
                ? 'Tu mejor horario para publicar es 8:00 PM. Los posts sobre la experiencia del valle tienen 40% más engagement. Intenta crear un Reel sobre transformación esta semana.'
                : 'Your best posting time is 8 PM. Valley experience posts get 40% more engagement. Try creating a Reel about transformation this week.'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Content */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">{t('recentContent')}</h2>
        </div>
        {contentItems && contentItems.length > 0 ? (
          <div className="space-y-3">
            {contentItems.map((item: any) => (
              <Link key={item.id} href={`/${locale}/create`} className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{PILLARS[item.pillar as keyof typeof PILLARS]?.emoji || '📝'}</span>
                    <div>
                      <p className="font-medium text-sm">{item.title || pillarLabel(item.pillar)}</p>
                      <p className="text-xs text-muted-foreground">{pillarLabel(item.pillar)} · {item.type}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    item.status === 'published' ? 'bg-green-500/10 text-green-500' :
                    item.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-muted text-muted-foreground'
                  }`}>{statusLabel(item.status)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Clock size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-bold text-muted-foreground">{t('noScheduled')}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t('createFirst')}</p>
            <Link href={`/${locale}/create`} className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
              <Plus size={14} />
              {t('createContent')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}