import { WorkflowBuilder } from '@/components/workflow/workflow-builder'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Campañas',
  description: 'Crea y gestiona campañas de contenido para Instagram',
}

export default function CampaignsPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <WorkflowBuilder />
    </div>
  )
}