import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContentGenerator } from '@/components/content/content-generator'
import { HashtagGenerator } from '@/components/instagram/hashtag-generator'
import { BestTimeToPost } from '@/components/instagram/best-time-to-post'
import { PenTool, Hash, Clock } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'

export default async function CreatePage({
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
    .select('ig_user_id, ig_username')
    .eq('user_id', user.id)
    .single()

  const language = profile?.language || locale || 'es'
  const brandVoice = profile?.brand_voice
    ? typeof profile.brand_voice === 'string'
      ? profile.brand_voice
      : JSON.stringify(profile.brand_voice)
    : ''
  const isConnected = !!igConnection

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <PenTool size={24} className="text-primary" />
          {locale === 'de' ? 'Inhalt erstellen' : locale === 'es' ? 'Crear Contenido' : 'Create Content'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'de'
            ? 'Generiere Inhalte mit KI in deiner Markenstimme'
            : locale === 'es'
            ? 'Genera contenido con IA en tu voz de marca'
            : 'Generate content with AI in your brand voice'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: AI Content Generator */}
        <div className="lg:col-span-2">
          <ContentGenerator
            userId={user.id}
            language={language}
            brandVoice={brandVoice}
          />
        </div>

        {/* Sidebar: Hashtags + Best Time */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <HashtagGenerator language={language} pillar="emotional_mastery" />
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <BestTimeToPost language={language} isConnected={isConnected} />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}