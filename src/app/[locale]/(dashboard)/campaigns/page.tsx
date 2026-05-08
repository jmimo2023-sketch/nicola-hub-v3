import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PILLARS } from '@/types'
import { Target, Plus } from 'lucide-react'

export default async function CampaignsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
  const lang = (profile?.language || locale || 'es') as 'es' | 'de' | 'en'

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { es: 'Campañas', de: 'Kampagnen', en: 'Campaigns' },
      subtitle: { es: 'Organiza tu contenido por campañas estratégicas', de: 'Organisiere deine Inhalte nach strategischen Kampagnen', en: 'Organize your content by strategic campaigns' },
      create: { es: 'Nueva Campaña', de: 'Neue Kampagne', en: 'New Campaign' },
      noCampaigns: { es: 'No hay campañas aún', de: 'Noch keine Kampagnen', en: 'No campaigns yet' },
      createFirst: { es: 'Crea tu primera campaña para organizar tu contenido', de: 'Erstelle deine erste Kampagne um deine Inhalte zu organisieren', en: 'Create your first campaign to organize your content' },
    }
    return translations[key]?.[lang] || key
  }

  const objectiveLabels: Record<string, Record<string, string>> = {
    engagement: { es: 'Engagement', de: 'Engagement', en: 'Engagement' },
    followers: { es: 'Seguidores', de: 'Follower', en: 'Followers' },
    conversions: { es: 'Conversiones', de: 'Konversionen', en: 'Conversions' },
    awareness: { es: 'Awareness', de: 'Bekanntheit', en: 'Awareness' },
  }

  const statusLabels: Record<string, Record<string, string>> = {
    draft: { es: 'Borrador', de: 'Entwurf', en: 'Draft' },
    active: { es: 'Activa', de: 'Aktiv', en: 'Active' },
    completed: { es: 'Completada', de: 'Abgeschlossen', en: 'Completed' },
    paused: { es: 'Pausada', de: 'Pausiert', en: 'Paused' },
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    active: 'bg-green-500/10 text-green-500',
    completed: 'bg-blue-500/10 text-blue-500',
    paused: 'bg-amber-500/10 text-amber-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Target size={24} className="text-primary" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus size={16} />
          {t('create')}
        </button>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="grid gap-4">
          {campaigns.map((campaign: any) => (
            <div key={campaign.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold">{campaign.name}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${statusColors[campaign.status] || 'bg-muted text-muted-foreground'}`}>
                  {statusLabels[campaign.status]?.[lang] || campaign.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{objectiveLabels[campaign.objective]?.[lang] || campaign.objective}</span>
                {campaign.pillar && <span>{PILLARS[campaign.pillar as keyof typeof PILLARS]?.emoji} {PILLARS[campaign.pillar as keyof typeof PILLARS]?.name}</span>}
                <span>{campaign.start_date} → {campaign.end_date}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <Target size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-bold text-muted-foreground">{t('noCampaigns')}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{t('createFirst')}</p>
        </div>
      )}
    </div>
  )
}