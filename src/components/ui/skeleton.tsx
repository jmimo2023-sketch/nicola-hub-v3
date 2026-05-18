'use client'

import { cn } from '@/lib/utils'

// ── Base Skeleton ──────────────────────────────────────────────────────────

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

// ── Card Skeleton — for stat cards ──────────────────────────────────────────

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border/50 bg-card p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

// ── Chart Skeleton — for chart areas ────────────────────────────────────────

function ChartSkeleton({ className, height = 250 }: { className?: string; height?: number }) {
  return (
    <div className={cn('rounded-xl border border-border/50 bg-card p-4', className)}>
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="space-y-3" style={{ height }}>
        {/* Y axis lines */}
        <div className="flex items-end justify-between h-full">
          {[0.3, 0.5, 0.7, 0.4, 0.6, 0.8, 0.45].map((h, i) => (
            <Skeleton
              key={i}
              className="w-full max-w-[12%] rounded-t"
              style={{ height: `${h * 100}%`, marginLeft: i > 0 ? '4px' : 0 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── List Skeleton — for inbox, comments ─────────────────────────────────────

function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-full max-w-[80%]" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ── Table Row Skeleton — for table rows ─────────────────────────────────────

function TableRowSkeleton({ columns = 4, className }: { columns?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 px-4 py-3 border-b border-border/50', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ flex: i === columns - 1 ? 1.5 : 1 }}
        />
      ))}
    </div>
  )
}

// ── Profile Skeleton — for profile cards ────────────────────────────────────

function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4 rounded-xl bg-card', className)}>
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  )
}

// ── Connection Card Skeleton ───────────────────────────────────────────────

function ConnectionCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border/50 bg-card p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

// ── Stats Row Skeleton — for grid of stat cards ────────────────────────────

function StatsRowSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── Insights Skeleton — full insights page skeleton ────────────────────────

function InsightsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <StatsRowSkeleton count={5} />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid md:grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  )
}

// ── Home Dashboard Skeleton ────────────────────────────────────────────────

function HomeDashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <ConnectionCardSkeleton />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
      <StatsRowSkeleton />
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ── Calendar Skeleton ───────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={`d-${i}`} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// ── Inbox Skeleton ─────────────────────────────────────────────────────────

function InboxSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ListSkeleton rows={6} className="lg:col-span-1" />
        <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
      </div>
    </div>
  )
}

export {
  Skeleton,
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
  TableRowSkeleton,
  ProfileSkeleton,
  ConnectionCardSkeleton,
  StatsRowSkeleton,
  InsightsPageSkeleton,
  HomeDashboardSkeleton,
  CalendarSkeleton,
  InboxSkeleton,
}