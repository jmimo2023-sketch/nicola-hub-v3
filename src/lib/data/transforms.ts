/**
 * Transform Supabase snake_case rows to camelCase for the app.
 * This is the single source of truth for data mapping.
 */

// ── Profile ──────────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  language: string
  brand_voice: Record<string, unknown> | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  userId: string
  displayName: string | null
  avatarUrl: string | null
  language: 'es' | 'de' | 'en'
  brandVoice: Record<string, unknown>
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export function transformProfile(row: ProfileRow | null): Profile | null {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    language: (row.language as 'es' | 'de' | 'en') || 'es',
    brandVoice: (row.brand_voice as Record<string, unknown>) || {},
    onboardingCompleted: row.onboarding_completed ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── MetaConnection ──────────────────────────────────────────────────────

export interface MetaConnectionRow {
  id: string
  user_id: string
  access_token: string
  expires_at: string
  scope: string | null
  ig_user_id: string | null
  ig_username: string | null
  ig_followers_count: number
  ig_media_count: number
  pages: unknown
  created_at: string
}

export interface MetaConnection {
  id: string
  userId: string
  accessToken: string
  expiresAt: string
  scope: string | null
  igUserId: string | null
  igUsername: string | null
  igFollowersCount: number
  igMediaCount: number
  pages: unknown
  isExpired: boolean
}

export function transformMetaConnection(row: MetaConnectionRow | null): MetaConnection | null {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    accessToken: row.access_token,
    expiresAt: row.expires_at,
    scope: row.scope,
    igUserId: row.ig_user_id,
    igUsername: row.ig_username,
    igFollowersCount: row.ig_followers_count || 0,
    igMediaCount: row.ig_media_count || 0,
    pages: row.pages || [],
    isExpired: row.expires_at ? new Date(row.expires_at) < new Date() : true,
  }
}

// ── ContentItem ──────────────────────────────────────────────────────────

export interface ContentItemRow {
  id: string
  user_id: string
  type: string
  pillar: string
  status: string
  title: string | null
  caption: string | null
  hashtags: string[]
  asset_ids: string[]
  scheduled_date: string | null
  scheduled_time: string | null
  timezone: string
  published_url: string | null
  published_at: string | null
  failure_reason: string | null
  ai_prompt: string | null
  generated_by: string
  template_id: string | null
  campaign_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ContentItem {
  id: string
  userId: string
  type: string
  pillar: string
  status: string
  title: string | null
  caption: string | null
  hashtags: string[]
  assetIds: string[]
  scheduledDate: string | null
  scheduledTime: string | null
  timezone: string
  publishedUrl: string | null
  publishedAt: string | null
  failureReason: string | null
  aiPrompt: string | null
  generatedBy: string
  templateId: string | null
  campaignId: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export function transformContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    pillar: row.pillar,
    status: row.status,
    title: row.title,
    caption: row.caption,
    hashtags: row.hashtags || [],
    assetIds: row.asset_ids || [],
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    timezone: row.timezone,
    publishedUrl: row.published_url,
    publishedAt: row.published_at,
    failureReason: row.failure_reason,
    aiPrompt: row.ai_prompt,
    generatedBy: row.generated_by,
    templateId: row.template_id,
    campaignId: row.campaign_id,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function transformContentItems(rows: ContentItemRow[]): ContentItem[] {
  return rows.map(transformContentItem)
}

// ── For writing back to Supabase ────────────────────────────────────────

export function profileToUpdate(profile: Partial<Profile>): Record<string, unknown> {
  const update: Record<string, unknown> = {}
  if (profile.displayName !== undefined) update.display_name = profile.displayName
  if (profile.language !== undefined) update.language = profile.language
  if (profile.brandVoice !== undefined) update.brand_voice = profile.brandVoice
  if (profile.onboardingCompleted !== undefined) update.onboarding_completed = profile.onboardingCompleted
  if (profile.avatarUrl !== undefined) update.avatar_url = profile.avatarUrl
  return update
}