import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SocialListeningPage } from '@/components/listening/social-listening-page'
import { PageTransition } from '@/components/ui/motion'

export default async function ListeningRoute({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <PageTransition>
      <SocialListeningPage />
    </PageTransition>
  )
}