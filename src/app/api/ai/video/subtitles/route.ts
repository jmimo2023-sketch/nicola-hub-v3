import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/ai/video/subtitles — Generate subtitles for video segments
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { segments, language = 'es', style = 'bottom' } = await request.json()

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: 'Missing segments array' }, { status: 400 })
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

    const prompt = `You are creating Instagram video subtitles. Given these video segments, generate short, punchy subtitle text for each one in ${language === 'es' ? 'Spanish' : language === 'de' ? 'German' : 'English'}.

Rules:
- Each subtitle should be 1-2 short sentences maximum
- Use Instagram-friendly language
- Include emojis where appropriate but don't overdo it
- Make text that would look good overlaid on video
- Keep it concise and impactful

Segments:
${JSON.stringify(segments, null, 2)}

Respond with a JSON array where each object has:
- id: same as segment id
- text: the subtitle text
- style: "${style}"
- fontSize: "medium"
- animation: "fade" or "pop" or "typewriter" (choose what fits best)
- color: "#FFFFFF"

Example: [{"id": "seg-1", "text": "¿Sabías que... 💡", "style": "bottom", "fontSize": "medium", "animation": "pop", "color": "#FFFFFF"}]`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nicola-hub-v3.vercel.app',
        'X-Title': 'Nicola Schaefer Hub - Video Subtitles',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: 'You are a video subtitle generator for Instagram. Always respond with valid JSON arrays only, no markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    let subtitles

    try {
      const content = data.choices?.[0]?.message?.content || '[]'
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      subtitles = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      // Fallback: generate basic subtitles from segment labels
      subtitles = segments.map((seg: any, i: number) => ({
        id: seg.id || `sub-${i}`,
        text: seg.label || seg.caption || `Segmento ${i + 1}`,
        style,
        fontSize: 'medium',
        animation: 'fade',
        color: '#FFFFFF',
      }))
    }

    // Add timing info from segments
    subtitles = subtitles.map((sub: any, i: number) => {
      const seg = segments[i] || segments[0]
      return {
        ...sub,
        startTime: seg.startTime || 0,
        endTime: seg.endTime || 5,
      }
    })

    return NextResponse.json({ subtitles })
  } catch (error: any) {
    console.error('[Video Subtitles] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}