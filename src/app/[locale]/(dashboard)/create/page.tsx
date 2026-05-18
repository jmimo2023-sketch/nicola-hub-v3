import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContentGenerator } from '@/components/content/content-generator'
import { AIContentStudio } from '@/components/ai/content-studio'
import { HashtagGenerator } from '@/components/instagram/hashtag-generator'
import { BestTimeToPost } from '@/components/instagram/best-time-to-post'
import { VideoStudio } from '@/components/video/video-studio'
import { PenTool, Sparkles, Hash, Clock, Film } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { transformProfile, transformMetaConnection, type ProfileRow, type MetaConnectionRow } from '@/lib/data/transforms'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crear',
  description: 'Crea contenido IA para Instagram — posts, reels, stories y más',
}

export default async function CreatePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: metaRow } = await supabase
    .from('meta_connections')
    .select('ig_user_id, ig_username')
    .eq('user_id', user.id)
    .single()

  const profile = transformProfile(profileRow as ProfileRow | null)
  const igConnection = transformMetaConnection(metaRow as MetaConnectionRow | null)

  const language = profile?.language || locale || 'es'
  const brandVoice = profile?.brandVoice
    ? typeof profile.brandVoice === 'string'
      ? profile.brandVoice
      : JSON.stringify(profile.brandVoice)
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
        {/* Main: AI Content Studio */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Studio (ideas, calendar, adapt) */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <AIContentStudio />
          </div>

          {/* Video Studio */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Film size={20} className="text-primary" />
              <h2 className="font-bold">
                {locale === 'de' ? 'Video Studio' : locale === 'es' ? 'Video Studio' : 'Video Studio'}
              </h2>
              <span className="text-xs text-muted-foreground">
                {locale === 'de' ? 'KI-gestützter Videoschnitt' : locale === 'es' ? 'Edición de video con IA' : 'AI-powered video editing'}
              </span>
            </div>
            <VideoStudio />
          </div>

          {/* Classic Content Generator */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-primary" />
              <h2 className="font-bold">
                {locale === 'de' ? 'Caption-Generator' : locale === 'es' ? 'Generador de Captions' : 'Caption Generator'}
              </h2>
            </div>
            <ContentGenerator
              userId={user.id}
              language={language}
              brandVoice={brandVoice}
            />
          </div>
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