import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContentGenerator } from '@/components/content/content-generator'
import { PenTool } from 'lucide-react'

export default async function CreatePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    profile = data
  }

  const language = profile?.language || locale || 'es'
  const brandVoice = profile?.brand_voice
    ? typeof profile.brand_voice === 'string'
      ? profile.brand_voice
      : JSON.stringify(profile.brand_voice)
    : ''

  return (
    <div className="space-y-6">
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

      <ContentGenerator
        userId={user.id}
        language={language}
        brandVoice={brandVoice}
      />
    </div>
  )
}