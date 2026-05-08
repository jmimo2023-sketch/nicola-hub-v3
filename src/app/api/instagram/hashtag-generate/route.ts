import { NextRequest, NextResponse } from 'next/server'
import { generateHashtags } from '@/lib/instagram/actions'

export async function POST(request: NextRequest) {
  try {
    const { topic, pillar, language, caption } = await request.json()
    if (!topic) {
      return NextResponse.json({ error: 'topic required' }, { status: 400 })
    }

    const result = await generateHashtags({ topic, pillar, language, caption })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}