import { InsightsPageSkeleton } from '@/components/ui/skeleton'

export default function InsightsLoading() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <InsightsPageSkeleton />
    </div>
  )
}