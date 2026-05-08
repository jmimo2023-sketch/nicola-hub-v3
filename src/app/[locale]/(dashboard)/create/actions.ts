'use server'

import { generateContent, type GenerateContentParams, type GeneratedContent } from '@/lib/gemini/generate'
import { createContentItem } from '@/lib/content/actions'

export async function aiGenerateContent(params: GenerateContentParams): Promise<GeneratedContent> {
  return generateContent(params)
}

export async function saveGeneratedContent(data: {
  userId: string
  type: string
  pillar: string
  caption: string
  hashtags: string[]
  aiPrompt: string
  title?: string
  hook?: string
  cta?: string
  metadata?: Record<string, unknown>
}) {
  return createContentItem({
    userId: data.userId,
    type: data.type,
    pillar: data.pillar,
    title: data.title || data.hook,
    caption: data.caption,
    hashtags: data.hashtags,
    aiPrompt: data.aiPrompt,
    generatedBy: 'ai',
    status: 'draft',
    metadata: {
      hook: data.hook,
      cta: data.cta,
      ...data.metadata,
    },
  })
}