'use client'

import { useState } from 'react'
import { OnboardingWizard } from './onboarding/onboarding-wizard'
import type { Profile } from '@/types'

interface OnboardingGateProps {
  profile: Profile | null
  children?: React.ReactNode
}

export function OnboardingGate({ profile, children }: OnboardingGateProps) {
  const [completed, setCompleted] = useState(false)

  if (completed || profile?.onboarding_completed) {
    return <>{children}</>
  }

  return <OnboardingWizard onComplete={() => setCompleted(true)} />
}