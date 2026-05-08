import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getUserPages, saveInstagramConnection } from '@/lib/instagram/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/es/settings?ig_error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/es/settings?ig_error=no_code', request.url)
    )
  }

  try {
    // Decode state to get userId
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    const userId = stateData.userId

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code)

    // Get user's pages
    const pages = await getUserPages(tokenData.accessToken)

    // Save connection
    await saveInstagramConnection(userId, tokenData.accessToken, tokenData.expiresIn, pages)

    return NextResponse.redirect(
      new URL('/es/settings?ig_connected=true', request.url)
    )
  } catch (err: any) {
    console.error('Instagram OAuth error:', err)
    return NextResponse.redirect(
      new URL(`/es/settings?ig_error=${encodeURIComponent(err.message)}`, request.url)
    )
  }
}