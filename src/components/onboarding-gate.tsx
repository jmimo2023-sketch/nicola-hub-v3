'use client'

import { useState } from 'react'
import { OnboardingWizard } from './onboarding/onboarding-wizard'

interface OnboardingGateProps {
  userId: string
  onboardingCompleted: boolean
  children?: React.ReactNode
}

export function OnboardingGate({ userId, onboardingCompleted, children }: OnboardingGateProps) {
  const [completed, setCompleted] = useState(false)

  if (completed || onboardingCompleted) {
    return <>{children}</>
  }

  return <OnboardingWizard userId={userId} onComplete={() => setCompleted(true)} />
}