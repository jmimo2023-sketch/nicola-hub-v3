'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// ============================================================
// CONTENT IDEAS — Trend-aware suggestions
// ============================================================

export async function generateContentIdeas(params: {
  language: string
  pillar: string
  niche?: string
  brandVoice?: string
  trendContext?: string
}) {
  const { language, pillar, niche, brandVoice, trendContext } = params

  const langMap = { es: 'español', de: 'deutsch', en: 'english' }
  const lang = langMap[language as keyof typeof langMap] || 'español'

  const pillarMap: Record<string, string> = {
    emotional_mastery: 'maestría emocional / espiritualidad / crecimiento interior',
    systematic_method: 'método sistemático / yoga / práctica disciplinada',
    valley_experience: 'vulnerabilidad / experiencia del valle / superación',
    transformation: 'transformación personal / evolución / cambio',
    community: 'comunidad / conexión / apoyo mutuo',
  }

  const prompt = `Eres un estratega de contenido Instagram experto para creadores de contenido espiritual, yoga y coaching.

Nicho: ${niche || 'yoga, espiritualidad, coaching personal'}
Pilar de contenido: ${pillarMap[pillar] || pillar}
Voz de marca: ${brandVoice || 'auténtica, cálida, inspiradora'}
${trendContext ? `Contexto de tendencia: ${trendContext}` : ''}

Genera 5 ideas de contenido creativas para Instagram. Para cada idea incluye:
1. **Título** — corto y llamativo
2. **Formato** — post, reel, story, o carrusel
3. **Hook** — primera línea que engancha (máximo 15 palabras)
4. **Descripción** — 2-3 líneas de qué tratará el contenido
5. **CTA** — llamada a la acción sugerida
6. **Hashtags sugeridos** — 5 hashtags relevantes
7. **Mejor momento** — mañana, mediodía, tarde, noche

Formato JSON array. Responde SOLO en ${lang}.`

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
      temperature: 0.9,
    }),
  })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || '[]'

  try {
    // Try to parse JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch {}

  // Fallback: return structured text as ideas
  return text.split('\n').filter((l: string) => l.trim()).map((l: string, i: number) => ({
    title: l.replace(/^\d+[\.\)]\s*/, '').trim(),
    format: 'post',
    hook: '',
    description: '',
    cta: '',
    hashtags: [],
    best_time: 'morning',
  })).slice(0, 5)
}

// ============================================================
// WEEKLY CALENDAR GENERATOR
// ============================================================

export async function generateWeeklyCalendar(params: {
  language: string
  pillars: string[]
  brandVoice?: string
  niche?: string
  weekStart?: string
}) {
  const { language, pillars, brandVoice, niche, weekStart } = params

  const langMap = { es: 'español', de: 'deutsch', en: 'english' }
  const lang = langMap[language as keyof typeof langMap] || 'español'

  const pillarMap: Record<string, string> = {
    emotional_mastery: 'Maestría Emocional',
    systematic_method: 'Método Sistemático',
    valley_experience: 'Experiencia del Valle',
    transformation: 'Transformación',
    community: 'Comunidad',
  }

  const pillarNames = pillars.map(p => pillarMap[p] || p).join(', ')

  const prompt = `Eres un planificador de contenido experto para creadores de contenido espiritual y de yoga.

Pilares de contenido: ${pillarNames}
Voz de marca: ${brandVoice || 'auténtica, cálida, inspiradora'}
Nicho: ${niche || 'yoga, espiritualidad, coaching'}
Semana comienza: ${weekStart || 'lunes'}

Crea un calendario semanal de 7 días con 1-2 publicaciones por día.

Para CADA publicación incluye:
- **día**: lunes/martes/miércoles/jueves/viernes/sábado/domingo
- **hora**: hora del día (HH:MM formato 24h)
- **formato**: post, reel, story, o carrusel
- **pilar**: cual de los pilares usa
- **titulo**: título corto
- **hook**: primera línea enganchante
- **caption**: texto completo del post (3-5 líneas)
- **cta**: llamada a la acción
- **hashtags**: array de 5-10 hashtags relevantes

Reglas:
- Varía formatos (no solo posts)
- Incluye al menos 1 reel y 2 stories
- Los fines de semana más ligeros
- Mezcla pilares a lo largo de la semana
- El lunes es motivacional, el miércoles educativo, el viernes reflexivo

Responde SOLO en ${lang} como JSON array.`

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2500,
      temperature: 0.8,
    }),
  })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || '[]'

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const calendar = JSON.parse(jsonMatch[0])
      // Save to content_items
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        for (const item of calendar) {
          await supabase.from('content_items').insert({
            user_id: user.id,
            type: item.formato || item.format || 'post',
            pillar: mapPillar(item.pilar || item.pillar),
            status: 'draft',
            title: item.titulo || item.title,
            caption: item.caption || item.texto || '',
            hashtags: item.hashtags || [],
            scheduled_date: getWeekDate(item.dia || item.day, weekStart),
            scheduled_time: item.hora || item.time || '09:00',
            generated_by: 'ai',
          })
        }
      }
      return calendar
    }
  } catch {}

  return []
}

function mapPillar(pillar: string): string {
  const map: Record<string, string> = {
    'Maestría Emocional': 'emotional_mastery',
    'Método Sistemático': 'systematic_method',
    'Experiencia del Valle': 'valley_experience',
    'Transformación': 'transformation',
    'Comunidad': 'community',
    'emotional_mastery': 'emotional_mastery',
    'systematic_method': 'systematic_method',
    'valley_experience': 'valley_experience',
    'transformation': 'transformation',
    'community': 'community',
  }
  return map[pillar] || 'emotional_mastery'
}

function getWeekDate(day: string, weekStart?: string): string {
  const days: Record<string, number> = {
    lunes: 1, martes: 2, miércoles: 3, jueves: 4, viernes: 5, sábado: 6, domingo: 0,
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0,
    montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6, sonntag: 0,
  }

  const start = weekStart ? new Date(weekStart) : new Date()
  const targetDay = days[day.toLowerCase()] ?? 1
  const currentDay = start.getDay()
  const diff = (targetDay - currentDay + 7) % 7

  const date = new Date(start)
  date.setDate(date.getDate() + diff)
  return date.toISOString().split('T')[0]
}

// ============================================================
// MULTI-FORMAT ADAPTATION
// ============================================================

export async function adaptContentFormat(params: {
  content: string
  sourceFormat: string
  targetFormat: string
  language: string
  brandVoice?: string
}) {
  const { content, sourceFormat, targetFormat, language, brandVoice } = params

  const langMap = { es: 'español', de: 'deutsch', en: 'english' }
  const lang = langMap[language as keyof typeof langMap] || 'español'

  const formatGuide: Record<string, string> = {
    post: 'Post de feed: caption de 3-5 líneas, 5-10 hashtags, CTA claro',
    reel: 'Reel: guion corto (15-30 segundos), texto en pantalla, música sugerida, descripción corta',
    story: 'Story: texto corto y visual (1-2 líneas), sticker sugerido, pregunta o encuesta CTA',
    carousel: 'Carrusel: 5-7 slides, cada uno con 1 idea, título en cada slide, CTA en el último',
  }

  const prompt = `Eres un experto en adaptación de contenido para Instagram.

Contenido original (${sourceFormat}):
"${content}"

Adapta este contenido a formato ${targetFormat}.
Guía: ${formatGuide[targetFormat] || formatGuide.post}
Voz de marca: ${brandVoice || 'auténtica, cálida, inspiradora'}

Responde en ${lang} con el contenido adaptado listo para publicar.`

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    }),
  })

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ============================================================
// TREND-AWARE CAPTION GENERATOR
// ============================================================

export async function generateTrendCaption(params: {
  language: string
  pillar: string
  trend: string
  brandVoice?: string
}) {
  const { language, pillar, trend, brandVoice } = params

  const langMap = { es: 'español', de: 'deutsch', en: 'english' }
  const lang = langMap[language as keyof typeof langMap] || 'español'

  const pillarMap: Record<string, string> = {
    emotional_mastery: 'maestría emocional',
    systematic_method: 'método sistemático',
    valley_experience: 'experiencia del valle',
    transformation: 'transformación',
    community: 'comunidad',
  }

  const prompt = `Eres un creador de contenido Instagram experto en tendencias.

Tendencia actual: "${trend}"
Pilar de contenido: ${pillarMap[pillar] || pillar}
Voz: ${brandVoice || 'auténtica, cálida, inspiradora'}

Crea un caption para Instagram que conecte esta tendencia con el pilar de contenido.
El caption debe:
- Abrir con un hook relacionado a la tendencia
- Conectar con el tema del pilar de forma auténtica
- Incluir una reflexión o enseñanza
- Terminar con CTA
- Tener 5-8 hashtags relevantes

Responde en ${lang}. Solo el caption, sin explicación.`

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.85,
    }),
  })

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}