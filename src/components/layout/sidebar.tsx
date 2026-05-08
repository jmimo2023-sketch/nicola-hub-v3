'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, PenTool, Calendar, BarChart3, FolderOpen, Target,
  Settings, Moon, Sun, Globe, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores'
import { createClient } from '@/lib/supabase/client'

const navSections = [
  { id: 'home', label: { en: 'Home', es: 'Inicio', de: 'Start' }, icon: Home, href: '/home' },
  { id: 'create', label: { en: 'Create', es: 'Crear', de: 'Erstellen' }, icon: PenTool, href: '/create' },
  { id: 'plan', label: { en: 'Plan', es: 'Planificar', de: 'Planen' }, icon: Calendar, href: '/plan' },
  { id: 'insights', label: { en: 'Insights', es: 'Insights', de: 'Insights' }, icon: BarChart3, href: '/insights' },
  { id: 'assets', label: { en: 'Assets', es: 'Assets', de: 'Assets' }, icon: FolderOpen, href: '/assets' },
  { id: 'campaigns', label: { en: 'Campaigns', es: 'Campañas', de: 'Kampagnen' }, icon: Target, href: '/campaigns' },
  { id: 'settings', label: { en: 'Settings', es: 'Ajustes', de: 'Einstellungen' }, icon: Settings, href: '/settings' },
]

export function Sidebar() {
  const { theme, setTheme, language, setLanguage } = useUIStore()
  const pathname = usePathname()
  const locale = pathname?.split('/')[1] || 'es'

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-card border-r border-border h-full overflow-y-auto">
      <div className="p-4 lg:p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-primary/20">N</div>
        <div>
          <h1 className="font-display text-lg font-bold">Nicola Hub</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Creator Platform</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navSections.map((section) => (
          <Link
            key={section.id}
            href={`/${locale}${section.href}`}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname === `/${locale}${section.href}` || pathname === section.href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <section.icon size={18} />
            <span>{section.label[language]}</span>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === 'light' ? (language === 'de' ? 'Dunkel' : 'Dark') : (language === 'de' ? 'Hell' : 'Light')}</span>
        </button>
        <button
          onClick={() => { const next = language === 'es' ? 'de' : language === 'de' ? 'en' : 'es'; setLanguage(next) }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Globe size={16} />
          <span>{language === 'es' ? 'Español' : language === 'de' ? 'Deutsch' : 'English'}</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
          <span>{language === 'de' ? 'Abmelden' : language === 'es' ? 'Cerrar sesión' : 'Sign out'}</span>
        </button>
      </div>
    </aside>
  )
}