'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface HashtagRequest {
  topic: string
  pillar: string
  language: string
  caption?: string
}

/** Generate hashtags using OpenRouter AI */
export async function generateHashtags({ topic, pillar, language, caption }: HashtagRequest) {
  const langMap = { es: 'español', de: 'deutsch', en: 'english' }
  const lang = langMap[language as keyof typeof langMap] || 'español'

  const pillarMap: Record<string, string> = {
    emotional_mastery: 'maestría emocional / espiritualidad / crecimiento interior',
    systematic_method: 'método sistemático / yoga / práctica disciplinada',
    valley_experience: 'experiencia del valle / vulnerabilidad / superación',
    transformation: 'transformación personal / evolución / cambio',
    community: 'comunidad / conexión / apoyo mutuo',
  }

  const pillarDesc = pillarMap[pillar] || pillar

  const prompt = `Eres un experto en Instagram hashtags para creadores de contenido espiritual, yoga y coaching.

Genera 30 hashtags relevantes para un post sobre: "${topic}"
Pilar de contenido: ${pillarDesc}
Idioma: ${lang}
${caption ? `Caption del post: "${caption}"` : ''}

REGLAS:
- Incluye una mezcla de hashtags de alto volumen (1M+), medio (100K-1M) y nicho (<100K)
- Máximo 5 hashtags genéricos, el resto deben ser específicos del nicho
- Incluye al menos 3 hashtags en ${lang}
- NO repitas el mismo hashtag
- Formato: solo hashtags separados por espacios, sin números, sin explicación
- Empieza cada hashtag con #

Hashtags:`

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    }),
  })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''

  // Parse hashtags from response
  const hashtags = text
    .match(/#[\w\u00C0-\u024F]+/g)
    ?.map((h: string) => h.toLowerCase())
    ?.filter((h: string, i: number, arr: string[]) => arr.indexOf(h) === i) // dedupe
    ?.slice(0, 30) || []

  // Categorize by estimated volume
  const categorized = {
    high: hashtags.slice(0, 5),       // First 5 likely high-volume
    medium: hashtags.slice(5, 15),    // Next 10 medium
    niche: hashtags.slice(15, 30),    // Rest niche
    all: hashtags,
  }

  return categorized
}

/** Save content item with hashtags to Supabase */
export async function saveContentWithHashtags(
  userId: string,
  content: {
    type: string
    pillar: string
    caption: string
    hashtags: string[]
    scheduledDate?: string
    scheduledTime?: string
    imageUrl?: string
  }
) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('content_items')
    .insert({
      user_id: userId,
      type: content.type,
      pillar: content.pillar,
      status: content.scheduledDate ? 'scheduled' : 'draft',
      caption: content.caption,
      hashtags: content.hashtags,
      scheduled_date: content.scheduledDate || null,
      scheduled_time: content.scheduledTime || null,
      metadata: content.imageUrl ? { image_url: content.imageUrl } : {},
      generated_by: 'ai',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Update content item (edit caption, schedule, etc.) */
export async function updateContentItem(
  userId: string,
  contentId: string,
  updates: {
    caption?: string
    hashtags?: string[]
    scheduledDate?: string
    scheduledTime?: string
    status?: string
  }
) {
  const supabase = await createServerSupabaseClient()

  const updateData: Record<string, any> = { ...updates }
  if (updates.scheduledDate !== undefined) {
    updateData.scheduled_date = updates.scheduledDate
    delete updateData.scheduledDate
  }
  if (updates.scheduledTime !== undefined) {
    updateData.scheduled_time = updates.scheduledTime
    delete updateData.scheduledTime
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status
    delete updateData.status
  }

  const { data, error } = await supabase
    .from('content_items')
    .update(updateData)
    .eq('id', contentId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Delete a content item */
export async function deleteContentItem(userId: string, contentId: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', contentId)
    .eq('user_id', userId)

  if (error) throw error
}

/** Fetch analytics snapshots for a date range */
export async function fetchAnalyticsSnapshots(userId: string, days = 30) {
  const supabase = await createServerSupabaseClient()
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: true })

  if (error) throw error
  return data || []
}

/** Save analytics snapshot */
export async function saveAnalyticsSnapshot(
  userId: string,
  snapshot: {
    date: string
    impressions: number
    reach: number
    likes: number
    comments: number
    shares: number
    saves: number
    followers: number
    engagement_rate: number
  }
) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('analytics_snapshots')
    .upsert(
      {
        user_id: userId,
        ...snapshot,
      },
      { onConflict: 'user_id,date' }
    )

  if (error) throw error
}