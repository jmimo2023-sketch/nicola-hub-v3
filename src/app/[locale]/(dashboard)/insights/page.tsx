'use client'

import { SmartInsights } from '@/components/insights/smart-insights'
import { PageTransition } from '@/components/ui/motion'

export default function InsightsPage() {
  return (
    <PageTransition className="p-4 md:p-6 max-w-7xl mx-auto">
      <SmartInsights />
    </PageTransition>
  )
}