// ============================================================================
// NICOLA SCHAEFER HUB v3 — Shared Types
// ============================================================================

// ── Content ────────────────────────────────────────────────────────────────

export type ContentPillar = 'emotional_mastery' | 'systematic_method' | 'valley_experience' | 'transformation' | 'community'
export type ContentType = 'post' | 'reel' | 'story' | 'carousel' | 'video'
export type ContentStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'failed'
export type ToneVariant = 'vulnerable' | 'empowering' | 'reflective' | 'provocative' | 'warm' | 'direct'
export type GeneratedBy = 'manual' | 'ai' | 'template'

export interface ContentItem {
  id: string
  userId: string
  type: ContentType
  pillar: ContentPillar
  status: ContentStatus
  title: string
  caption: string
  hashtags: string[]
  assetIds: string[]
  scheduledDate: string | null
  scheduledTime: string | null
  timezone: string
  publishedUrl: string | null
  publishedAt: string | null
  failureReason: string | null
  aiPrompt: string | null
  generatedBy: GeneratedBy
  templateId: string | null
  campaignId: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ── Assets ──────────────────────────────────────────────────────────────────

export type AssetType = 'image' | 'video' | 'template' | 'design'
export type AssetStatus = 'draft' | 'approved' | 'archived'

export interface Asset {
  id: string
  userId: string
  name: string
  type: AssetType
  folder: string
  storagePath: string
  url: string
  thumbnailUrl: string | null
  size: number
  mimeType: string
  width: number | null
  height: number | null
  duration: number | null
  pillar: ContentPillar | null
  tags: string[]
  status: AssetStatus
  usageCount: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ── Templates ──────────────────────────────────────────────────────────────

export interface ContentTemplate {
  id: string
  userId: string | null
  name: string
  pillar: ContentPillar
  type: ContentType
  language: 'es' | 'de' | 'en'
  description: string
  hookPattern: string
  structure: string[]
  ctaPattern: string
  hashtagGroups: string[][]
  toneGuidance: string
  example: string
  isCustom: boolean
  createdAt: string
}

// ── Campaigns ───────────────────────────────────────────────────────────────

export type CampaignObjective = 'engagement' | 'followers' | 'conversions' | 'awareness'
export type CampaignStatus = 'draft' | 'active' | 'completed' | 'paused'

export interface Campaign {
  id: string
  userId: string
  name: string
  objective: CampaignObjective
  pillar: ContentPillar | null
  startDate: string
  endDate: string
  status: CampaignStatus
  metrics: Record<string, number>
  createdAt: string
  updatedAt: string
}

// ── CRM ─────────────────────────────────────────────────────────────────────

export type LeadSource = 'instagram' | 'whatsapp' | 'referral' | 'website' | 'event' | 'manual'
export type LeadStatus = 'new' | 'contacted' | 'interested' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | 'nurturing'
export type ClientTier = 'free' | 'basic' | 'premium' | 'vip'

export interface CRMContact {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  instagramHandle: string | null
  source: LeadSource
  status: LeadStatus
  tier: ClientTier
  tags: string[]
  notes: string
  engagementScore: number
  dealValue: number
  lastContactAt: string | null
  createdAt: string
  updatedAt: string
}

// ── Meta / Instagram ───────────────────────────────────────────────────────

export interface MetaConnection {
  id: string
  userId: string
  accessToken: string
  expiresAt: string
  scope: string
  igUserId: string | null
  igUsername: string | null
  igFollowersCount: number
  igMediaCount: number
  pages: MetaPage[]
  createdAt: string
}

export interface MetaPage {
  id: string
  name: string
  accessToken: string
  igBusinessAccount: {
    id: string
    username: string
    name?: string
    followersCount?: number
    mediaCount?: number
  } | null
}

// ── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsSnapshot {
  id: string
  userId: string
  date: string
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  followers: number
  engagementRate: number
  createdAt: string
}

// ── Profile ────────────────────────────────────────────────────────────────

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

// ── Publishing Queue ──────────────────────────────────────────────────────

export type QueueStatus = 'pending' | 'publishing' | 'published' | 'failed' | 'cancelled'

export interface PublishingQueueItem {
  id: string
  userId: string
  contentItemId: string
  status: QueueStatus
  scheduledAt: string
  publishedAt: string | null
  failureReason: string | null
  attempts: number
  maxAttempts: number
  igContainerId: string | null
  igPermalink: string | null
  createdAt: string
  updatedAt: string
}

// ── Workflow ──────────────────────────────────────────────────────────────

export type WorkflowTrigger = 'manual' | 'scheduled' | 'milestone' | 'event'
export type WorkflowExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface Workflow {
  id: string
  userId: string
  name: string
  description: string | null
  triggerType: WorkflowTrigger
  triggerConfig: Record<string, unknown>
  steps: WorkflowStep[]
  isActive: boolean
  isTemplate: boolean
  lastRunAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkflowStep {
  id: string
  type: 'generate_ideas' | 'create_draft' | 'review' | 'approve' | 'schedule' | 'publish' | 'analyze' | 'notify'
  config: Record<string, unknown>
}

// ── Notification ──────────────────────────────────────────────────────

export type NotificationType = 'publish_success' | 'publish_failed' | 'comment' | 'milestone' | 'reminder' | 'insight' | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string | null
  data: Record<string, unknown>
  read: boolean
  actionUrl: string | null
  createdAt: string
}

// ── Navigation ──────────────────────────────────────────────────────────────

export type NavSection = 'home' | 'create' | 'plan' | 'insights' | 'assets' | 'campaigns' | 'settings'

export interface NavItem {
  id: NavSection
  label: { en: string; es: string; de: string }
  icon: string
  href: string
  badge?: string
  children?: NavItem[]
}

// ── Pilar config ────────────────────────────────────────────────────────────

export const PILLARS: Record<ContentPillar, { name: string; emoji: string; color: string; description: { en: string; es: string; de: string } }> = {
  emotional_mastery: {
    name: 'Emotional Mastery',
    emoji: '💜',
    color: '#8B5CF6',
    description: {
      en: 'Deep emotional intelligence, vulnerability as strength',
      es: 'Inteligencia emocional profunda, la vulnerabilidad como fortaleza',
      de: 'Tiefe emotionale Intelligenz, Verletzlichkeit als Stärke',
    },
  },
  systematic_method: {
    name: 'Systematic Method',
    emoji: '🔧',
    color: '#3B82F6',
    description: {
      en: 'Structured frameworks, step-by-step growth',
      es: 'Marcos estructurados, crecimiento paso a paso',
      de: 'Strukturierte Rahmen, schrittweises Wachstum',
    },
  },
  valley_experience: {
    name: 'Valley Experience',
    emoji: '🏔️',
    color: '#F59E0B',
    description: {
      en: 'Lessons from difficult times, resilience',
      es: 'Lecciones de tiempos difíciles, resiliencia',
      de: 'Lektionen aus schweren Zeiten, Widerstandskraft',
    },
  },
  transformation: {
    name: 'Transformation',
    emoji: '🦋',
    color: '#10B981',
    description: {
      en: 'Before/after stories, personal evolution',
      es: 'Historias antes/después, evolución personal',
      de: 'Vorher/Nachher-Geschichten, persönliche Entwicklung',
    },
  },
  community: {
    name: 'Community',
    emoji: '🤝',
    color: '#EC4899',
    description: {
      en: 'Building connections, shared experiences',
      es: 'Construyendo conexiones, experiencias compartidas',
      de: 'Verbindungen aufbauen, gemeinsame Erfahrungen',
    },
  },
}