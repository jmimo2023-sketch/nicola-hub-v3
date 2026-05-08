// Content CRUD operations using Supabase

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function createContentItem(data: {
  userId: string
  type: string
  pillar: string
  title?: string
  caption?: string
  hashtags?: string[]
  aiPrompt?: string
  generatedBy?: string
  status?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createServerSupabaseClient()

  const { data: item, error } = await supabase
    .from('content_items')
    .insert({
      user_id: data.userId,
      type: data.type,
      pillar: data.pillar,
      title: data.title || null,
      caption: data.caption || null,
      hashtags: data.hashtags || [],
      ai_prompt: data.aiPrompt || null,
      generated_by: data.generatedBy || 'ai',
      status: data.status || 'draft',
      metadata: data.metadata || {},
    })
    .select()
    .single()

  if (error) throw error
  return item
}

export async function updateContentItem(id: string, data: Record<string, unknown>) {
  const supabase = await createServerSupabaseClient()

  const { data: item, error } = await supabase
    .from('content_items')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return item
}

export async function getContentItems(userId: string, filters?: { pillar?: string; status?: string; type?: string }) {
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('content_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filters?.pillar) query = query.eq('pillar', filters.pillar)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.type) query = query.eq('type', filters.type)

  const { data: items, error } = await query

  if (error) throw error
  return items
}

export async function deleteContentItem(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}