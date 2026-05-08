import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Skip auth routes and API routes
  matcher: ['/', '/(de|es|en)/:path*', '/((?!auth|api|login|_next|_vercel|.*\\..*).*)'],
}