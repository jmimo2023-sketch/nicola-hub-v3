import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { AuthProvider } from '@/components/auth-provider'
import { OnboardingGate } from '@/components/onboarding-gate'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return (
    <AuthProvider>
      <DashboardShell user={user}>
        <OnboardingGate profile={profile}>
          {children}
        </OnboardingGate>
      </DashboardShell>
    </AuthProvider>
  )
}