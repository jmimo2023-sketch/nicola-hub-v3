import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// POST /api/ai/video/highlights — AI-powered video highlight detection
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { videoDuration, pillar, contentType, criteria } = body

    if (!videoDuration) {
      return NextResponse.json({ error: 'Missing videoDuration' }, { status: 400 })
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
    const duration = Number(videoDuration)

    // Use AI to suggest optimal video segments based on criteria
    const criteriaPrompt = criteria || 'engagement, emotional impact, visual quality'

    const prompt = `You are an expert video editor specializing in Instagram content. Given a video of ${duration} seconds, suggest the best segments to create a ${contentType || 'reel'}.

Content pillar: ${pillar || 'emotional_mastery'}
Selection criteria: ${criteriaPrompt}

Respond with a JSON array of segments, each with:
- startTime (seconds)
- endTime (seconds) 
- label (short description in Spanish)
- type (one of: highlight, intro, outro, action, emotion, speech)
- score (0-100 relevance score)
- caption (suggested Instagram caption overlay text in Spanish)

Keep total selected duration under 60 seconds for a reel, 15 seconds for a story, 30 seconds for a post.
Focus on the most engaging moments that match the content pillar.

Example response:
[{"startTime": 0, "endTime": 3, "label": "Hook impactante", "type": "intro", "score": 85, "caption": "¿Sabías que..."}]`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nicola-hub-v3.vercel.app',
        'X-Title': 'Nicola Schaefer Hub - Video AI',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: 'You are a video editing AI assistant. Always respond with valid JSON arrays only, no markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AI API error: ${error}`)
    }

    const data = await response.json()
    let segments

    try {
      const content = data.choices?.[0]?.message?.content || '[]'
      // Try to parse the JSON from the AI response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      segments = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      // Fallback: generate basic segments
      segments = generateFallbackSegments(duration)
    }

    // Ensure segments are within video bounds
    segments = segments.map((seg: any, i: number) => ({
      id: `seg-${i + 1}`,
      startTime: Math.max(0, Math.min(duration, Number(seg.startTime) || 0)),
      endTime: Math.max(Number(seg.startTime) || 0, Math.min(duration, Number(seg.endTime) || duration * 0.1)),
      label: seg.label || `Segmento ${i + 1}`,
      score: Math.max(0, Math.min(100, Number(seg.score) || 70)),
      type: seg.type || 'highlight',
      caption: seg.caption || '',
      selected: Number(seg.score || 70) >= 75,
    }))

    return NextResponse.json({ segments })
  } catch (error: any) {
    console.error('[Video Highlights] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

function generateFallbackSegments(duration: number) {
  const segments = []
  const segLen = Math.min(10, duration / 4)

  segments.push({
    startTime: 0, endTime: Math.min(3, duration),
    label: 'Hook / Intro', type: 'intro', score: 85, caption: '¿Sabías que...', selected: true
  })

  if (duration > 10) {
    segments.push({
      startTime: duration * 0.25, endTime: Math.min(duration * 0.25 + segLen, duration),
      label: 'Punto clave', type: 'highlight', score: 88, caption: '', selected: true
    })
  }

  if (duration > 20) {
    segments.push({
      startTime: duration * 0.5, endTime: Math.min(duration * 0.5 + segLen, duration),
      label: 'Momento emocional', type: 'emotion', score: 82, caption: '', selected: true
    })
  }

  if (duration > 30) {
    segments.push({
      startTime: duration * 0.75, endTime: Math.min(duration * 0.75 + segLen, duration),
      label: 'Segundo highlight', type: 'highlight', score: 78, caption: '', selected: false
    })
  }

  segments.push({
    startTime: Math.max(0, duration - 5), endTime: duration,
    label: 'CTA / Outro', type: 'outro', score: 76, caption: 'Sígueme para más 🔔', selected: true
  })

  return segments
}