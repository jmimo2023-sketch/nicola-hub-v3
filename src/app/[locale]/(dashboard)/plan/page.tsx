import { ContentCalendar } from '@/components/calendar/content-calendar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planificador',
  description: 'Planifica y programa tus publicaciones de Instagram',
}

export default function PlanPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <ContentCalendar />
    </div>
  )
}