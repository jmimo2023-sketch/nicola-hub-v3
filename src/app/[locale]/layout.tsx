import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Nicola Hub — Content Intelligence Platform', template: '%s | Nicola Hub' },
  description: 'AI-powered content creation, scheduling, and analytics for Instagram creators — Publica, programa y analiza tus contenidos',
  keywords: ['instagram', 'content creation', 'AI', 'scheduling', 'analytics', 'coaching', 'yoga', 'spirituality'],
  authors: [{ name: 'Nicola Schaefer' }],
  openGraph: {
    title: 'Nicola Hub',
    description: 'Content Intelligence Platform for Instagram Creators',
    type: 'website',
    siteName: 'Nicola Hub',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nicola Hub — Content Intelligence Platform',
    description: 'AI-powered content creation, scheduling, and analytics for Instagram creators',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale} data-theme="light" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}