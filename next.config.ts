import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https' as const, hostname: 'scontent.cdninstagram.com' },
      { protocol: 'https' as const, hostname: 'graph.instagram.com' },
      { protocol: 'https' as const, hostname: 'nicola-hub-v3.vercel.app' },
    ],
  },
}

export default withBundleAnalyzer(withNextIntl(nextConfig))