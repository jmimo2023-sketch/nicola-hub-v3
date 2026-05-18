import { HomeDashboard } from '@/components/home/home-dashboard'
import { PageTransition } from '@/components/ui/motion'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inicio',
  description: 'Panel principal de Nicola Hub — resumen de tu actividad en Instagram',
}

export default function HomePage() {
  return (
    <PageTransition>
      <HomeDashboard />
    </PageTransition>
  )
}