import { NextRequest, NextResponse } from 'next/server'
import { adaptContentFormat } from '@/lib/ai/content-engine'

export async function POST(request: NextRequest) {
  try {
    const { content, sourceFormat, targetFormat, language, brandVoice } = await request.json()
    if (!content || !targetFormat) {
      return NextResponse.json({ error: 'content and targetFormat required' }, { status: 400 })
    }

    const adapted = await adaptContentFormat({
      content,
      sourceFormat: sourceFormat || 'post',
      targetFormat,
      language: language || 'es',
      brandVoice,
    })

    return NextResponse.json({ content: adapted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}