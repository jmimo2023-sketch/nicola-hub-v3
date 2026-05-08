'use client'

import { useAuth } from '@/components/auth-provider'
import { useUIStore } from '@/stores'
import { Menu, Bell, Search, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const { user, profile, signOut } = useAuth()
  const { language } = useUIStore()
  const pathname = usePathname()
  const locale = pathname?.split('/')[1] || 'es'

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Mobile menu toggle */}
      <button
        onClick={() => {}}
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
            placeholder={language === 'de' ? 'Inhalte, Assets suchen...' : language === 'es' ? 'Buscar contenido, assets...' : 'Search content, assets...'}
            className="w-full pl-9 pr-4 py-2 bg-muted rounded-xl text-sm border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-muted relative">
          <Bell size={18} className="text-muted-foreground" />
        </button>
        {user && (
          <Link href={`/${locale}/settings`} className="flex items-center gap-2 hover:bg-muted rounded-lg px-2 py-1.5 transition-colors">
            <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
              {profile?.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'N'}
            </div>
            <span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">
              {profile?.displayName || user.email?.split('@')[0]}
            </span>
          </Link>
        )}
      </div>
    </header>
  )
}