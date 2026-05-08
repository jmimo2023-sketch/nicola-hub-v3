// Gemini AI integration for content generation
// Uses server-side API calls to keep the key secure

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
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

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('No content generated')
  }

  try {
    const parsed = JSON.parse(text)
    return {
      caption: parsed.caption || '',
      hashtags: parsed.hashtags || [],
      hook: parsed.hook || '',
      cta: parsed.cta || '',
      alternativeCaptions: parsed.alternativeCaptions || [],
    }
  } catch {
    // If JSON parsing fails, return the raw text
    return {
      caption: text,
      hashtags: [],
      hook: '',
      cta: '',
      alternativeCaptions: [],
    }
  }
}