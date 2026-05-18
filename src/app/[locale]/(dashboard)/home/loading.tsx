import { HomeDashboardSkeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
  return (
    <div className="p-4 md:p-6">
      <HomeDashboardSkeleton />
    </div>
  )
}