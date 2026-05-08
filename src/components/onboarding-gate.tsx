'use client'

import { useState } from 'react'
import { OnboardingWizard } from './onboarding/onboarding-wizard'

interface OnboardingGateProps {
  onboardingCompleted: boolean
  children?: React.ReactNode
}

export function OnboardingGate({ onboardingCompleted, children }: OnboardingGateProps) {
  const [completed, setCompleted] = useState(false)

  if (completed || onboardingCompleted) {
    return <>{children}</>
  }

  return <OnboardingWizard onComplete={() => setCompleted(true)} />
}