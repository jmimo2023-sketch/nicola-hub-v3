'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PenTool, Calendar, BarChart3, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores'

const mobileNavItems = [
  { id: 'home', label: { en: 'Home', es: 'Inicio', de: 'Start' }, icon: Home, href: '/' },
  { id: 'create', label: { en: 'Create', es: 'Crear', de: 'Erstellen' }, icon: PenTool, href: '/create' },
  { id: 'plan', label: { en: 'Plan', es: 'Plan', de: 'Planen' }, icon: Calendar, href: '/plan' },
  { id: 'insights', label: { en: 'Insights', es: 'Insights', de: 'Insights' }, icon: BarChart3, href: '/insights' },
]

export function MobileNav() {
  const pathname = usePathname()
  const { language } = useUIStore()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around py-2 px-4 z-50">
      {mobileNavItems.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors',
            pathname === item.href
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