'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PenTool, Calendar, BarChart3, Inbox, Ear } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores'

const mobileNavItems = [
  { id: 'home', label: { en: 'Home', es: 'Inicio', de: 'Start' }, icon: Home, href: '/home' },
  { id: 'create', label: { en: 'Create', es: 'Crear', de: 'Erstellen' }, icon: PenTool, href: '/create' },
  { id: 'inbox', label: { en: 'Inbox', es: 'Bandeja', de: 'Inbox' }, icon: Inbox, href: '/inbox' },
  { id: 'listening', label: { en: 'Listen', es: 'Escucha', de: 'Listen' }, icon: Ear, href: '/listening' },
  { id: 'insights', label: { en: 'Insights', es: 'Insights', de: 'Insights' }, icon: BarChart3, href: '/insights' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { language } = useUIStore()
  const locale = pathname?.split('/')[1] || 'es'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around py-2 px-2 z-50">
      {mobileNavItems.map((item) => (
        <Link
          key={item.id}
          href={`/${locale}${item.href}`}
          className={cn(
            'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors',
            pathname === `/${locale}${item.href}` || pathname === item.href
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
        >
          <item.icon size={20} />
          <span className="text-[10px] font-medium">{item.label[language]}</span>
        </Link>
      ))}
    </nav>
  )
}