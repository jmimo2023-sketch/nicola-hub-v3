'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { MobileNav } from './mobile-nav'

interface DashboardShellProps {
  user: any
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}