// OpenRouter AI integration for content generation
// Uses free models via OpenRouter API

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface GenerateContentParams {
  pillar: string
  pillarName: string
  type: string
  tone: string
  language: string
  brandVoice: string
  topic?: string
  context?: string
}

export interface GeneratedContent {
  caption: string
  hashtags: string[]
  hook: string
  cta: string
  alternativeCaptions: string[]
}

export async function generateContent(params: GenerateContentParams): Promise<GeneratedContent> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  const langMap: Record<string, string> = { es: 'Spanish', de: 'German', en: 'English' }
  const language = langMap[params.language] || 'Spanish'

  const prompt = `You are an expert Instagram content strategist for Nicola Schaefer, a yoga & spirituality coach. 

CONTENT PILLAR: ${params.pillarName} (${params.pillar})
CONTENT TYPE: ${params.type}
TONE: ${params.tone}
LANGUAGE: Write everything in ${language}
BRAND VOICE: ${params.brandVoice || 'Warm, inspiring, authentic, deeply spiritual yet practical'}
${params.topic ? `TOPIC: ${params.topic}` : ''}
${params.context ? `ADDITIONAL CONTEXT: ${params.context}` : ''}

Generate Instagram content with these components:

1. A powerful HOOK (first line that stops the scroll) — max 15 words
2. A main CAPTION (full post text) — 100-200 words, engaging and authentic
3. A clear CTA (call to action) — max 10 words
4. 3 ALTERNATIVE CAPTIONS (different angles, shorter, 50-80 words each)
5. 15-20 HASHTAGS (mix of popular and niche, relevant to the pillar)

Respond ONLY in this JSON format:
{
  "hook": "...",
  "caption": "...",
  "cta": "...",
  "alternativeCaptions": ["...", "...", "..."],
  "hashtags": ["...", "...", "..."]
}

Be authentic, avoid clichés, and make it feel like Nicola wrote it herself. Use emojis sparingly but effectively.`

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://nicola-hub-v3.vercel.app',
      'X-Title': 'Nicola Schaefer Hub',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content

  if (!text) {
    throw new Error('No content generated')
  }

  try {
    // Try to extract JSON from the response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        caption: parsed.caption || '',
        hashtags: parsed.hashtags || [],
        hook: parsed.hook || '',
        cta: parsed.cta || '',
        alternativeCaptions: parsed.alternativeCaptions || [],
      }
    }
    throw new Error('No JSON found')
  } catch {
    return {
      caption: text,
      hashtags: [],
      hook: '',
      cta: '',
      alternativeCaptions: [],
    }
  }
}