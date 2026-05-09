// ============================================================================
// NICOLA SCHAEFER HUB v3 — AI Shortcuts Engine
// Quick content transformations inspired by Metricool's AI assistant
// ============================================================================

import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────

export type ShortcutAction =
  | 'emojify'
  | 'hashtags'
  | 'cta'
  | 'tone_change'
  | 'translate'
  | 'shorten'
  | 'lengthen'
  | 'repurpose'
  | 'hook'
  | 'rewrite'

export interface ShortcutRequest {
  action: ShortcutAction
  text: string
  pillar?: string
  tone?: string
  targetLanguage?: 'es' | 'de' | 'en'
  contentType?: 'post' | 'reel' | 'story' | 'carousel'
  brandVoice?: Record<string, unknown>
}

export interface ShortcutResponse {
  result: string
  action: ShortcutAction
  metadata?: Record<string, unknown>
}

// ── Shortcut Prompts ───────────────────────────────────────────────────────

const SHORTCUT_PROMPTS: Record<ShortcutAction, (req: ShortcutRequest) => string> = {
  emojify: (req) => `Add relevant emojis to this Instagram caption. Place emojis naturally throughout the text, not just at the end. Keep the original text, just add emojis. Do not change the words.

Caption:
${req.text}

Return only the emojified caption, no explanations.`,

  hashtags: (req) => `Generate 15-20 strategic Instagram hashtags for this caption. Mix popular (500K+ posts), medium (50K-500K), and niche (under 50K) hashtags. Group them by relevance.

Caption:
${req.text}

Return a JSON object: { "hashtags": ["#hashtag1", "#hashtag2", ...], "groups": { "primary": [...], "secondary": [...], "niche": [...] } }`,

  cta: (req) => `Add a compelling call-to-action to this Instagram caption. The CTA should match the tone and naturally flow from the content. Options: question, save for later, share with someone, comment below, link in bio.

Caption:
${req.text}

Return only the caption with the CTA added at the end, no explanations.`,

  tone_change: (req) => `Rewrite this Instagram caption changing the tone to "${req.tone || 'empowering'}". Keep the core message but adjust the language, word choice, and emotional register.

Available tones: vulnerable, empowering, reflective, provocative, warm, direct

Original caption:
${req.text}

Return only the rewritten caption, no explanations.`,

  translate: (req) => `Translate this Instagram caption to ${req.targetLanguage === 'es' ? 'Spanish' : req.targetLanguage === 'de' ? 'German' : 'English'}. Adapt cultural references and idioms naturally. Keep the emotional impact.

Original caption:
${req.text}

Return only the translated caption, no explanations.`,

  shorten: (req) => `Shorten this Instagram caption while keeping the core message and emotional impact. Cut any redundancy. Target: 50-70% of original length.

Original caption:
${req.text}

Return only the shortened caption, no explanations.`,

  lengthen: (req) => `Expand this Instagram caption with more detail, storytelling elements, and emotional depth. Add sensory language and personal touches. Target: 150-200% of original length.

Original caption:
${req.text}

Return only the expanded caption, no explanations.`,

  repurpose: (req) => `Adapt this content for Instagram ${req.contentType || 'reel'}. Transform it to fit the format:

- For Reel: Create a short script with hook (first 3 seconds), value delivery, and CTA
- For Story: Create 3-4 story slides with text overlays
- For Carousel: Create 5-7 slide titles and key points
- For Post: Expand into a full caption with paragraphs

Original content:
${req.text}

Return only the adapted content, no explanations.`,

  hook: (req) => `Create 5 scroll-stopping hook/opening lines for this Instagram caption. The hooks should make people stop scrolling immediately. Use curiosity gaps, bold statements, questions, or surprising facts.

Caption context:
${req.text}

Return a JSON array of 5 hooks: ["hook1", "hook2", "hook3", "hook4", "hook5"]`,

  rewrite: (req) => `Rewrite this Instagram caption to be more engaging and impactful. Improve the flow, word choice, and emotional resonance. Keep the same core message but make it impossible to scroll past.

Original caption:
${req.text}

Return only the rewritten caption, no explanations.`,
}

// ── Execute Shortcut ────────────────────────────────────────────────────────

export async function executeShortcut(request: ShortcutRequest): Promise<ShortcutResponse> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!
  const prompt = SHORTCUT_PROMPTS[request.action](request)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://nicola-hub-v3.vercel.app',
      'X-Title': 'Nicola Schaefer Hub',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: 'You are a social media content expert for a personal brand focused on emotional growth and transformation. You create authentic, engaging Instagram content. Always respond in the requested format without meta-commentary.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI API error: ${error}`)
  }

  const data = await response.json()
  const result = data.choices?.[0]?.message?.content || ''

  // Parse JSON responses for hashtags and hooks
  let metadata: Record<string, unknown> | undefined
  if (request.action === 'hashtags') {
    try {
      const parsed = JSON.parse(result)
      metadata = parsed
    } catch {
      // If AI didn't return valid JSON, return raw text
    }
  } else if (request.action === 'hook') {
    try {
      const parsed = JSON.parse(result)
      metadata = { hooks: parsed }
    } catch {
      // If AI didn't return valid JSON, return raw text
    }
  }

  return {
    result,
    action: request.action,
    metadata,
  }
}