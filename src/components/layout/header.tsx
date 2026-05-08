'use client'

import { useUIStore } from '@/stores'
import { Menu, X, Bell, Search } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Mobile menu toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-muted"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search content, assets, templates..."
            className="w-full pl-9 pr-4 py-2 bg-muted rounded-xl text-sm border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-muted relative">
          <Bell size={18} className="text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
          N
        </div>
      </div>
    </header>
  )
}