'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInstagramConnection } from './auth'

const META_BASE = 'https://graph.instagram.com'

/** Get access token and IG user ID */
async function getIgTokens(userId: string) {
  const conn = await getInstagramConnection(userId)
  if (!conn) throw new Error('Instagram no conectado')
  if (conn.isExpired) throw new Error('Token de Instagram expirado. Reconecta tu cuenta.')
  if (!conn.access_token) throw new Error('Token no disponible')

  return { pageToken: conn.access_token, igUserId: conn.ig_user_id }
}

// ============================================================
// COMMENTS
// ============================================================

/** Fetch recent comments on user's media */
export async function getInstagramComments(userId: string, limit = 50) {
  const { pageToken, igUserId } = await getIgTokens(userId)

  // First get user's recent media
  const mediaRes = await fetch(
    `${META_BASE}/${igUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=${limit}&access_token=${pageToken}`
  )
  const mediaData = await mediaRes.json()
  if (mediaData.error) throw new Error(mediaData.error.message || 'Error obteniendo medios')

  // For each media, get comments
  const allComments: any[] = []

  for (const media of (mediaData.data || []).slice(0, 10)) {
    const commentsRes = await fetch(
      `${META_BASE}/${media.id}/comments?fields=id,text,from,timestamp,like_count&access_token=${pageToken}`
    )
    const commentsData = await commentsRes.json()
    if (commentsData.data) {
      for (const comment of commentsData.data) {
        allComments.push({
          ...comment,
          media: {
            id: media.id,
            caption: media.caption?.substring(0, 80),
            media_type: media.media_type,
            media_url: media.media_url,
            permalink: media.permalink,
          },
          type: 'comment',
        })
      }
    }
  }

  // Sort by timestamp desc
  allComments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return allComments
}

/** Reply to a comment */
export async function replyToComment(userId: string, commentId: string, message: string) {
  const { pageToken } = await getIgTokens(userId)

  const res = await fetch(`${META_BASE}/${commentId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      access_token: pageToken,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Error respondiendo al comentario')
  return data
}

/** Hide a comment */
export async function hideComment(userId: string, commentId: string) {
  const { pageToken } = await getIgTokens(userId)

  const res = await fetch(`${META_BASE}/${commentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hidden: true,
      access_token: pageToken,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Error ocultando comentario')
  return data
}

/** Delete a comment */
export async function deleteComment(userId: string, commentId: string) {
  const { pageToken } = await getIgTokens(userId)

  const res = await fetch(`${META_BASE}/${commentId}?access_token=${pageToken}`, {
    method: 'DELETE',
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'Error eliminando comentario')
  return data
}

// ============================================================
// DMs — Limited availability with Instagram Login API
// ============================================================

/** Fetch Instagram DM conversations — NOT FULLY AVAILABLE with Instagram Login */
export async function getInstagramDMs(userId: string, _limit = 25) {
  // Instagram Login API does not support DM reading via the same endpoint as Facebook Login
  // DMs require instagram_business_manage_messages permission + different endpoint
  // For now, return empty array until we implement the proper DM flow
  console.warn('getInstagramDMs: DM functionality requires additional setup with Instagram Login API')
  return []
}

/** Send a DM — NOT FULLY AVAILABLE with Instagram Login */
export async function sendInstagramDM(_userId: string, _recipientId: string, _message: string) {
  // Instagram Login API DMs use a different flow than Facebook Login
  // Requires instagram_business_manage_messages scope and conversation-based messaging
  throw new Error('Envío de DMs no disponible aún con Instagram Login. Se implementará en una futura actualización.')
}

// ============================================================
// SMART REPLIES (AI-generated) — No Meta API changes needed
// ============================================================

export async function generateSmartReply(
  message: string,
  context: { language: string; brandVoice?: string; pillar?: string }
) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
  const langMap = { es: 'español', de: 'deutsch', en: 'english' }
  const lang = langMap[context.language as keyof typeof langMap] || 'español'

  const prompt = `Eres un asistente de redes sociales para una coach espiritual y de yoga. Tu voz es cálida, auténtica y empoderadora.

Un seguidor escribió este mensaje en Instagram:
"${message}"

${context.brandVoice ? `Voz de marca: ${context.brandVoice}` : ''}
${context.pillar ? `Pilar de contenido: ${context.pillar}` : ''}

Genera 3 opciones de respuesta en ${lang}. Cada respuesta debe ser:
- Corta (máximo 2 líneas)
- Auténtica y cálida
- Que invite a la conversación
- Coherente con la marca

Formato: solo las 3 respuestas numeradas, sin explicación.`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.8,
    }),
  })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''

  // Parse numbered responses
  const replies = text
    .split(/\n/)
    .filter((l: string) => /^\d[\.\)]/.test(l.trim()))
    .map((l: string) => l.replace(/^\d[\.\)]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3)

  return replies.length > 0 ? replies : [text.trim()]
}

// ============================================================
// SAVED REPLY TEMPLATES — No Meta API changes needed
// ============================================================

const supabaseTables = {
  replyTemplates: 'reply_templates',
}

export async function getReplyTemplates(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from(supabaseTables.replyTemplates)
    .select('*')
    .eq('user_id', userId)
    .order('usage_count', { ascending: false })

  if (error) {
    // Table might not exist yet, return defaults
    return getDefaultTemplates(userId)
  }
  return data
}

export async function saveReplyTemplate(userId: string, template: { name: string; text: string; category?: string }) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from(supabaseTables.replyTemplates)
    .insert({
      user_id: userId,
      name: template.name,
      text: template.text,
      category: template.category || 'general',
      usage_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

function getDefaultTemplates(userId: string) {
  return [
    { id: 'default-1', user_id: userId, name: 'Gracias ❤️', text: '¡Gracias por tu mensaje! Me alegra mucho leerte 💚', category: 'gratitude', usage_count: 0 },
    { id: 'default-2', user_id: userId, name: 'Te leo 🙏', text: 'Te leo y te siento. Gracias por compartir esto conmigo 🙏', category: 'empathy', usage_count: 0 },
    { id: 'default-3', user_id: userId, name: 'Próximo evento 📅', text: '¡Gracias por preguntar! Puedes encontrar toda la info en mi link en bio 📅✨', category: 'info', usage_count: 0 },
    { id: 'default-4', user_id: userId, name: 'Coaching privado 🦋', text: '¡Me encantaría trabajar contigo! Envíame un DM para más info sobre coaching privado 🦋', category: 'sales', usage_count: 0 },
    { id: 'default-5', user_id: userId, name: 'Respira 🧘‍♀️', text: 'Recuerda: respira hondo. Todo va a estar bien 🧘‍♀️💚', category: 'wellness', usage_count: 0 },
  ]
}