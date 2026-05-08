import { NextRequest, NextResponse } from 'next/server'
import { getInstagramAuthUrl } from '@/lib/instagram/auth'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const url = await getInstagramAuthUrl(userId)
    return NextResponse.json({ url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}