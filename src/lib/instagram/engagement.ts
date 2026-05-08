'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

const META_API_VERSION = 'v21.0'
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`

/** Get Page access token and IG user ID */
async function getIgtokens(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: conn } = await supabase
    .from('meta_connections')
    .select('access_token, ig_user_id')
    .eq('user_id', userId)
    .single()

  if (!conn) throw new Error('Instagram no conectado')
  if (!conn.access_token) throw new Error('Token no disponible')

  return { pageToken: conn.access_token, igUserId: conn.ig_user_id }
}

// ============================================================
// COMMENTS
// ============================================================

/** Fetch recent comments on user's media */
export async function getInstagramComments(userId: string, limit = 50) {
  const { pageToken, igUserId } = await getIgtokens(userId)

  // First get user's recent media
  const mediaRes = await fetch(
    `${META_BASE}/${igUserId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=${limit}&access_token=${pageToken}`
  )
  const mediaData = await mediaRes.json()
  if (mediaData.error) throw new Error(mediaData.error.message)

  // For each media, get comments
  const allComments: any[] = []

  for (const media of (mediaData.data || []).slice(0, 10)) {
    const commentsRes = await fetch(
      `${META_BASE}/${media.id}/comments?fields=id,text,from,timestamp,like_count,replies&access_token=${pageToken}`
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
  const { pageToken } = await getIgtokens(userId)

  const res = await fetch(`${META_BASE}/${commentId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      access_token: pageToken,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

/** Hide a comment */
export async function hideComment(userId: string, commentId: string) {
  const { pageToken } = await getIgtokens(userId)

  const res = await fetch(`${META_BASE}/${commentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hidden: true,
      access_token: pageToken,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

/** Delete a comment */
export async function deleteComment(userId: string, commentId: string) {
  const { pageToken } = await getIgtokens(userId)

  const res = await fetch(`${META_BASE}/${commentId}?access_token=${pageToken}`, {
    method: 'DELETE',
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

// ============================================================
// DMs (Conversations via Messenger API)
// ============================================================

/** Fetch Instagram DM conversations */
export async function getInstagramDMs(userId: string, limit = 25) {
  const { pageToken, igUserId } = await getIgtokens(userId)

  // Get conversations
  const convRes = await fetch(
    `${META_BASE}/${igUserId}/conversations?fields=id,participants,snippet,updated_time,message_count,unread_count&limit=${limit}&access_token=${pageToken}`
  )
  const convData = await convRes.json()
  if (convData.error) throw new Error(convData.error.message)

  const conversations = []

  for (const conv of convData.data || []) {
    // Get messages in this conversation
    const msgRes = await fetch(
      `${META_BASE}/${conv.id}/messages?fields=id,message,from,created_time,attachments&limit=20&access_token=${pageToken}`
    )
    const msgData = await msgRes.json()

    conversations.push({
      id: conv.id,
      participants: conv.participants?.data || [],
      snippet: conv.snippet,
      updated_time: conv.updated_time,
      message_count: conv.message_count,
      unread_count: conv.unread_count,
      messages: (msgData.data || []).map((m: any) => ({
        id: m.id,
        text: m.message,
        from: m.from,
        created_time: m.created_time,
        attachments: m.attachments?.data || [],
      })),
      type: 'dm',
    })
  }

  // Sort by updated_time desc
  conversations.sort((a, b) => new Date(b.updated_time).getTime() - new Date(a.updated_time).getTime())
  return conversations
}

/** Send a DM */
export async function sendInstagramDM(userId: string, recipientId: string, message: string) {
  const { pageToken } = await getIgtokens(userId)

  const res = await fetch(`${META_BASE}/me/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      access_token: pageToken,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

// ============================================================
// SMART REPLIES (AI-generated)
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
// SAVED REPLY TEMPLATES
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