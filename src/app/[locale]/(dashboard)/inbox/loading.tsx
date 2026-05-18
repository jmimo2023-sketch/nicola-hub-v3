import { InboxSkeleton } from '@/components/ui/skeleton'

export default function InboxLoading() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <InboxSkeleton />
    </div>
  )
}