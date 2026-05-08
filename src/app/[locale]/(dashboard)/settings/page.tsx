import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsPage } from '@/components/settings/settings-page'

export default async function SettingsPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return <SettingsPage profile={profile} userId={user.id} locale={locale} />
}