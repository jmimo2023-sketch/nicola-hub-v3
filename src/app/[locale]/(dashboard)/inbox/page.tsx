import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InboxPage } from '@/components/inbox/inbox-page'
import { PageTransition } from '@/components/ui/motion'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bandeja de Entrada',
  description: 'Gestiona tus mensajes y notificaciones de Instagram',
}

export default async function InboxRoute({
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
      <InboxPage />
    </PageTransition>
  )
}