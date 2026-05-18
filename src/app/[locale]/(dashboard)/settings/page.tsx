import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsPage } from '@/components/settings/settings-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ajustes',
  description: 'Configura tu cuenta y conexión de Instagram',
}

export default async function SettingsPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <SettingsPage />
}