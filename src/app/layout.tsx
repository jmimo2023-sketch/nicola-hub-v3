import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://nicola-hub-v3.vercel.app'),
  title: { default: 'Nicola Hub', template: '%s | Nicola Hub' },
  description: 'Plataforma de gestión de Instagram — publica, programa y analiza tus contenidos',
  keywords: ['instagram', 'social media', 'scheduler', 'analytics', 'AI', 'content creation', 'coaching'],
}

export const viewport: Viewport = {
  themeColor: '#8B5CF6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}