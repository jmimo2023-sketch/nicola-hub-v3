import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Nicola Schaefer Hub — Content Intelligence Platform',
  description: 'AI-powered content creation, scheduling, and analytics for Instagram creators',
  keywords: ['instagram', 'content creation', 'AI', 'scheduling', 'analytics', 'coaching', 'yoga', 'spirituality'],
  authors: [{ name: 'Nicola Schaefer' }],
  openGraph: {
    title: 'Nicola Schaefer Hub',
    description: 'Content Intelligence Platform for Instagram Creators',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}