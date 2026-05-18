import { CalendarSkeleton } from '@/components/ui/skeleton'

export default function PlanLoading() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <CalendarSkeleton />
    </div>
  )
}