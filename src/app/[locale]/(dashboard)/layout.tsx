import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { AuthProvider } from '@/components/auth-provider'
import { OnboardingGate } from '@/components/onboarding-gate'
import { transformProfile, transformMetaConnection, type ProfileRow, type MetaConnectionRow } from '@/lib/data/transforms'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
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
    .select('*')
    .eq('user_id', user.id)
    .single()

  const profile = transformProfile(profileRow as ProfileRow | null)
  const igConnection = transformMetaConnection(metaRow as MetaConnectionRow | null)

  return (
    <AuthProvider>
      <DashboardShell user={user} igConnection={igConnection}>
        <OnboardingGate onboardingCompleted={profile?.onboardingCompleted ?? false}>
          {children}
        </OnboardingGate>
      </DashboardShell>
    </AuthProvider>
  )
}