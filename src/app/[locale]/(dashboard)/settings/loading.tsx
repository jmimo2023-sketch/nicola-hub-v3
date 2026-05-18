import { Skeleton, ProfileSkeleton, ConnectionCardSkeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-2xl p-4 md:p-6">
      <Skeleton className="h-8 w-32" />
      <ConnectionCardSkeleton />
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}