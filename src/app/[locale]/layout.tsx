import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Inter, Playfair_Display } from 'next/font/google'
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
        </NextIntlClientProvider>
      </body>
    </html>
  )
}