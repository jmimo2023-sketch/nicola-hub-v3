'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const META_API_VERSION = 'v21.0'
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`

// ============================================================
// SOCIAL LISTENING — Monitor mentions and brand keywords
// ============================================================

export async function getBrandMentions(userId: string, keywords: string[], limit = 50) {
  const supabase = await createServerSupabaseClient()
  const { data: conn } = await supabase
    .from('meta_connections')
    .select('access_token, ig_user_id, ig_username')
    .eq('user_id', userId)
    .single()

  if (!conn) throw new Error('Instagram no conectado')

  // Get comments on user's media that mention keywords
  const mediaRes = await fetch(
    `${META_BASE}/${conn.ig_user_id}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=25&access_token=${conn.access_token}`
  )
  const mediaData = await mediaRes.json()
  if (mediaData.error) throw new Error(mediaData.error.message)

  const mentions: any[] = []

  for (const media of mediaData.data || []) {
    // Get comments for this media
    const commentsRes = await fetch(
      `${META_BASE}/${media.id}/comments?fields=id,text,from,timestamp,like_count&limit=${limit}&access_token=${conn.access_token}`
    )
    const commentsData = await commentsRes.json()

    for (const comment of commentsData.data || []) {
      const textLower = (comment.text || '').toLowerCase()
      const matchedKeywords = keywords.filter(k => textLower.includes(k.toLowerCase()))

      if (matchedKeywords.length > 0) {
        mentions.push({
          id: comment.id,
          type: 'comment',
          text: comment.text,
          sender: comment.from?.name || comment.from?.username || 'User',
          timestamp: comment.timestamp,
          media: {
            id: media.id,
            caption: media.caption?.substring(0, 80),
            permalink: media.permalink,
            media_url: media.media_url,
          },
          matchedKeywords,
          sentiment: await analyzeSentiment(comment.text),
        })
      }
    }
  }

  // Also check DM conversations for keyword matches
  try {
    const convRes = await fetch(
      `${META_BASE}/${conn.ig_user_id}/conversations?fields=id,participants,snippet,updated_time&limit=10&access_token=${conn.access_token}`
    )
    const convData = await convRes.json()

    for (const conv of convData.data || []) {
      const textLower = (conv.snippet || '').toLowerCase()
      const matchedKeywords = keywords.filter(k => textLower.includes(k.toLowerCase()))

      if (matchedKeywords.length > 0) {
        mentions.push({
          id: conv.id,
          type: 'dm',
          text: conv.snippet,
          sender: conv.participants?.data?.[0]?.name || 'User',
          timestamp: conv.updated_time,
          media: null,
          matchedKeywords,
          sentiment: await analyzeSentiment(conv.snippet || ''),
        })
      }
    }
  } catch {}

  mentions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return mentions
}

// ============================================================
// SENTIMENT ANALYSIS — AI-based
// ============================================================

export async function analyzeSentiment(text: string): Promise<{
  label: 'positive' | 'negative' | 'neutral' | 'mixed'
  score: number // -1 to 1
  emotions: string[]
}> {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [{
          role: 'user',
          content: `Analyze the sentiment of this text. Respond ONLY with a JSON object with fields:
- "label": one of "positive", "negative", "neutral", "mixed"
- "score": a number from -1 (very negative) to 1 (very positive)
- "emotions": array of detected emotions (max 3)

Text: "${text}"

JSON:`
        }],
        max_tokens: 100,
        temperature: 0.1,
      }),
    })

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '{}'

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        label: ['positive', 'negative', 'neutral', 'mixed'].includes(parsed.label) ? parsed.label : 'neutral',
        score: typeof parsed.score === 'number' ? parsed.score : 0,
        emotions: Array.isArray(parsed.emotions) ? parsed.emotions : [],
      }
    }
  } catch {}

  return { label: 'neutral', score: 0, emotions: [] }
}

// ============================================================
// CRISIS / ALERT DETECTION
// ============================================================

export async function detectCrisisAlerts(userId: string, mentions: any[]) {
  const negativeMentions = mentions.filter(m =>
    m.sentiment?.label === 'negative' || m.sentiment?.score < -0.3
  )

  // If more than 3 negative mentions in last 24h, flag as potential crisis
  const recentNegative = negativeMentions.filter(m => {
    const ts = new Date(m.timestamp)
    const dayAgo = new Date(Date.now() - 86400000)
    return ts > dayAgo
  })

  const alerts: Array<{
    type: 'crisis' | 'trend' | 'opportunity'
    severity: 'high' | 'medium' | 'low'
    title: string
    description: string
    count: number
  }> = []

  if (recentNegative.length >= 3) {
    alerts.push({
      type: 'crisis',
      severity: recentNegative.length >= 5 ? 'high' : 'medium',
      title: 'Spike en menciones negativas',
      description: `${recentNegative.length} menciones negativas en las últimas 24h. Revisa los comentarios y responde rápidamente.`,
      count: recentNegative.length,
    })
  }

  // Detect trending keywords (mentioned more than once)
  const keywordCounts: Record<string, number> = {}
  for (const m of mentions) {
    for (const kw of m.matchedKeywords || []) {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1
    }
  }

  for (const [kw, count] of Object.entries(keywordCounts)) {
    if (count >= 3) {
      alerts.push({
        type: 'trend',
        severity: 'medium',
        title: `"${kw}" está trending`,
        description: `"${kw}" apareció ${count} veces en menciones recientes. Considera crear contenido sobre este tema.`,
        count,
      })
    }
  }

  // Positive opportunity: high engagement on positive mentions
  const positiveMentions = mentions.filter(m => m.sentiment?.score > 0.5)
  if (positiveMentions.length >= 2) {
    alerts.push({
      type: 'opportunity',
      severity: 'low',
      title: 'Alto sentimiento positivo',
      description: `${positiveMentions.length} menciones muy positivas. Gran momento para pedir testimonios o UGC.`,
      count: positiveMentions.length,
    })
  }

  return alerts
}

// ============================================================
// TREND DISCOVERY — Find emerging topics in niche
// ============================================================

export async function discoverTrends(params: {
  language: string
  niche: string
  pillars: string[]
}) {
  const { language, niche, pillars } = params

  const langMap = { es: 'español', de: 'deutsch', en: 'english' }
  const lang = langMap[language as keyof typeof langMap] || 'español'

  const pillarMap: Record<string, string> = {
    emotional_mastery: 'maestría emocional',
    systematic_method: 'método sistemático',
    valley_experience: 'vulnerabilidad',
    transformation: 'transformación',
    community: 'comunidad',
  }

  const pillarNames = pillars.map(p => pillarMap[p] || p).join(', ')

  const prompt = `Eres un experto en tendencias de Instagram para el nicho de ${niche}.

Pilares de contenido: ${pillarNames}
Idioma: ${lang}

Identifica 10 tendencias emergentes o temas que están ganando tracción AHORA en este nicho en Instagram.
Para cada tendencia incluye:
- **nombre**: nombre corto de la tendencia
- **descripcion**: 1-2 líneas explicando por qué es tendencia
- **hashtags**: 3-5 hashtags relacionados
- **tipo**: "content" (contenido a crear), "engagement" (oportunidad de interacción), o "hashtag" (hashtag trending)
- **urgencia**: "alta", "media", "baja"
- **pilar**: cuál de los pilares encaja mejor

Responde SOLO como JSON array en ${lang}.`

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.8,
    }),
  })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || '[]'

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch {}

  return []
}

// ============================================================
// SAVE/LOAD LISTENING KEYWORDS
// ============================================================

export async function getListeningKeywords(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_voice')
    .eq('user_id', userId)
    .single()

  const bv = (profile?.brand_voice as any) || {}
  return bv.listening_keywords || ['yoga', 'mindfulness', 'coaching', 'meditación', 'espiritualidad']
}

export async function saveListeningKeywords(userId: string, keywords: string[]) {
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_voice')
    .eq('user_id', userId)
    .single()

  const bv = (profile?.brand_voice as any) || {}
  bv.listening_keywords = keywords

  await supabase
    .from('profiles')
    .update({ brand_voice: bv })
    .eq('user_id', userId)

  return keywords
}