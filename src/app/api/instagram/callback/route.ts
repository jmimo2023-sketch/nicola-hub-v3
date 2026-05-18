import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, exchangeLongLivedToken, getInstagramUserProfile, saveInstagramConnection } from '@/lib/instagram/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')

  if (error) {
    const errorMsg = errorReason || error
    return NextResponse.redirect(
      new URL(`/es/settings?ig_error=${encodeURIComponent(errorMsg)}`, request.url)
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

    // Step 1: Exchange code for short-lived token
    const shortLived = await exchangeCodeForToken(code)

    // Step 2: Exchange short-lived token for long-lived token
    const longLived = await exchangeLongLivedToken(shortLived.accessToken)

    // Step 3: Get Instagram user profile
    const profile = await getInstagramUserProfile(longLived.accessToken)

    // Step 4: Save connection to Supabase
    await saveInstagramConnection(userId, longLived.accessToken, longLived.expiresIn, {
      igUserId: profile.igUserId,
      username: profile.username,
      accountType: profile.accountType,
      mediaCount: profile.mediaCount,
      followersCount: profile.followersCount,
    })

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