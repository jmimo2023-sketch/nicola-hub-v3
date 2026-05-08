'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, PenTool, Calendar, BarChart3, FolderOpen, Target,
  Settings, ChevronDown, Sparkles, Film, Image, Palette, Moon, Sun,
  Globe, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores'

const navSections = [
  {
    id: 'home',
    label: { en: 'Home', es: 'Inicio', de: 'Start' },
    icon: Home,
    href: '/',
  },
  {
    id: 'create',
    label: { en: 'Create', es: 'Crear', de: 'Erstellen' },
    icon: PenTool,
    href: '/create',
    children: [
      { id: 'generator', label: { en: 'Generator', es: 'Generador', de: 'Generator' }, icon: Sparkles, href: '/create', badge: 'AI' },
      { id: 'design', label: { en: 'Design Studio', es: 'Design Studio', de: 'Design Studio' }, icon: Palette, href: '/create/design', badge: 'NEW' },
      { id: 'video', label: { en: 'Video Studio', es: 'Video Studio', de: 'Video Studio' }, icon: Film, href: '/create/video', badge: 'PRO' },
    ],
  },
  {
    id: 'plan',
    label: { en: 'Plan', es: 'Planificar', de: 'Planen' },
    icon: Calendar,
    href: '/plan',
  },
  {
    id: 'insights',
    label: { en: 'Insights', es: 'Insights', de: 'Insights' },
    icon: BarChart3,
    href: '/insights',
  },
  {
    id: 'assets',
    label: { en: 'Assets', es: 'Assets', de: 'Assets' },
    icon: FolderOpen,
    href: '/assets',
  },
  {
    id: 'campaigns',
    label: { en: 'Campaigns', es: 'Campañas', de: 'Kampagnen' },
    icon: Target,
    href: '/campaigns',
  },
  {
    id: 'settings',
    label: { en: 'Settings', es: 'Ajustes', de: 'Einstellungen' },
    icon: Settings,
    href: '/settings',
  },
]

export function Sidebar() {
  const { theme, setTheme, language, setLanguage, sidebarOpenSection, toggleSidebarSection } = useUIStore()
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-card border-r border-border h-full overflow-y-auto">
      {/* Logo */}
      <div className="p-4 lg:p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-primary/20">
          N
        </div>
        <div>
          <h1 className="font-display text-lg font-bold">Nicola Hub</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Creator Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navSections.map((section) => (
          <div key={section.id}>
            {'children' in section && section.children ? (
              <div>
                <button
                  onClick={() => toggleSidebarSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    pathname?.startsWith(section.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <section.icon size={18} />
                  <span className="flex-1 text-left">{section.label[language]}</span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'transition-transform',
                      sidebarOpenSection === section.id && 'rotate-180'
                    )}
                  />
                </button>
                {sidebarOpenSection === section.id && (
                  <div className="ml-4 mt-1 space-y-1">
                    {section.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                          pathname === child.href
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <child.icon size={16} />
                        <span className="flex-1">{child.label[language]}</span>
                        {child.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                            {child.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={section.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  pathname === section.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <section.icon size={18} />
                <span>{section.label[language]}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          <span>{theme === 'light' ? (language === 'de' ? 'Dunkel' : 'Dark') : (language === 'de' ? 'Hell' : 'Light')}</span>
        </button>
        <button
          onClick={() => setLanguage(language === 'es' ? 'de' : language === 'de' ? 'en' : 'es')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Globe size={16} />
          <span>{language === 'es' ? 'Español' : language === 'de' ? 'Deutsch' : 'English'}</span>
        </button>
      </div>
    </aside>
  )
}